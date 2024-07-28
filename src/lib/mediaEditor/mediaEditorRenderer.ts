import {defaultMediaEncoderValues, MediaEditorPath, MediaEditorValues} from './mediaEditorValues'
import {Point, Rect} from './geometry'
import {MediaEditorState} from './mediaEditorState'
import attachGrabListeners from '../../helpers/dom/attachGrabListeners'
import {createBlurPainter} from './paint/blur'
import {attachClickEvent} from '../../helpers/dom/clickEvent'

type WorkerEventData = {
  type: 'frameReady'
  bitmap: ImageBitmap
}

type RectAndScale = {rect: Rect, scale: number}
type OnResizeEvent = RectAndScale & {isRestored: boolean}

class Lazy<T> {
  private _value: T
  private getter: () => T

  constructor(getter: () => T) {
    this.getter = getter
  }

  get value() {
    if(this._value === undefined) {
      this._value = this.getter()
    }
    return this._value
  }

  invalidate() {
    this._value = undefined
  }
}

class AnimationTimer {
  duration: number
  startTime: number | null = null
  running = false

  elapsed = 0

  constructor(duration: number) {
    this.duration = duration
  }

  start() {
    this.elapsed = 0
    this.running = true
    this.startTime = null
  }

  frame(timestamp: number) {
    if(!this.running) {
      return
    }

    if(this.startTime === null) {
      this.startTime = timestamp
    }

    this.elapsed = Math.min(1, Math.max(0, (timestamp - this.startTime) / this.duration))

    if(this.elapsed >= 1) {
      this.running = false
      this.startTime = null
    }
  }
}

const paddingInCropMode = 300

export class MediaEditorRenderer {
  public onResize: (image: OnResizeEvent) => void

  private worker: Worker
  private mainCanvas: HTMLCanvasElement
  private img = new Image()

  private needsUpdate = false
  private waitingForFrame = false
  private waitingForImage = true
  private waitingForSize = true

  private width = 0
  private height = 0

  private values: MediaEditorValues = structuredClone(defaultMediaEncoderValues)

  private switchModeTimer = new AnimationTimer(500)
  private flipTimer = new AnimationTimer(500)

  private cropMode = false

  private drawMode = false
  private unregisterDrawListeners: () => void

  private textMode = false
  private unregisterTextListeners: () => void

  private filtersInvalidated = true

  private drawCanvas = document.createElement('canvas')
  private drawCtx = this.drawCanvas.getContext('2d')

  private blurCanvas = document.createElement('canvas')
  private blurCtx = this.blurCanvas.getContext('2d')

  private paintBlur = createBlurPainter(this.drawCtx, this.blurCanvas)

  /** User draws on cropped image but points must be in original image coordinates */
  public pointMatcher = new Lazy(() => {
    // Use 0 as padding, because drawing is not available in crop move
    const padding = 0

    const {crop, transformRotation, rotation} = this.values
    const cropScale = Math.min((this.width - padding) / crop.width, (this.height - padding) / crop.height)
    const totalRotation = (rotation + transformRotation) % 360

    const imageRect = Rect.from2Points({x: 0, y: 0}, {x: this.img.width, y: this.img.height})
    imageRect.rotation = totalRotation
    const bounds = imageRect.boundingBox
    bounds.rotation = totalRotation

    const cropW = crop.width * cropScale
    const cropH = crop.height * cropScale

    const cropX = (this.width - cropW) / 2
    const cropY = (this.height - cropH) / 2

    return {
      toImagePoint: (point: Point) => {
        return bounds.unrotatePoint({
          x: (point.x - cropX) / cropScale + crop.x,
          y: (point.y - cropY) / cropScale + crop.y
        })
      },
      toScreenPoint: (point: Point) => {
        return bounds.rotatePoint({
          x: (point.x - crop.x) * cropScale + cropX,
          y: (point.y - crop.y) * cropScale + cropY
        })
      }
    }
  })

  private dispatchResize = (isRestored: boolean = false) => {
    if(this.waitingForImage || this.waitingForSize) {
      return
    }

    const kek = this.getImageRectAndScale()

    let rect = kek.rect
    rect.rotation = this.values.transformRotation
    rect = rect.boundingBox

    this.onResize?.({
      rect,
      scale: kek.scale,
      isRestored
    })
  }

  constructor(canvas: HTMLCanvasElement, private state: MediaEditorState) {
    this.switchModeTimer.elapsed = 1

    this.img.onload = () => {
      this.waitingForImage = false
      this.requestFrame()
      this.dispatchResize()

      this.drawCanvas.width = this.img.width
      this.drawCanvas.height = this.img.height

      this.blurCanvas.width = this.img.width
      this.blurCanvas.height = this.img.height
    }

    this.mainCanvas = canvas

    this.worker = new Worker(new URL('./mediaEditorRenderer.worker.ts', import.meta.url), {type: 'module'})
    this.worker.addEventListener('message', (event) => {
      const data: WorkerEventData = event.data
      switch(data.type) {
        case 'frameReady':
          this.onFrameReady(data.bitmap)
          break
      }
    })

    state.addEventListener('changed', (values, fields, isRestored) => {
      this.values = values
      if(fields.includes('crop') || fields.includes('rotation') || fields.includes('transformRotation')) {
        this.pointMatcher.invalidate()
      }
      if(fields.includes('transformRotation')) {
        this.dispatchResize(isRestored)
      }
      if(fields.includes('flip')) {
        this.flipTimer.start()
      }
      if(fields.includes('filters')) {
        this.filtersInvalidated = true
      }
      this.requestFrame()
    })

    state.addEventListener('restored', (values, fields) => {
      if(fields.includes('paintings')) {
        // redraw all paths
        this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height)
        for(const path of values.paintings) {
          if(path.type === 'path') {
            this.painter.startPath(path, path.points[0])
            if(path.tool === 'blur') {
              this.paintBlur(path)
              continue
            }
            for(let i = 1; i < path.points.length; i++) {
              this.painter.updatePath(path, path.points[i])
            }
            this.painter.endPath(path)
          }
        }
      }
    })
  }

  public export(): Promise<File> {
    const resultCanvas = document.createElement('canvas')
    const crop = this.state.current.crop
    resultCanvas.width = crop.width
    resultCanvas.height = crop.height

    const renderedImage = this.getRenderedImage()

    const ctx = resultCanvas.getContext('2d')
    ctx.drawImage(
      renderedImage.canvas,
      crop.x + renderedImage.shift.x,
      crop.y + renderedImage.shift.y,
      crop.width,
      crop.height,
      0, 0, crop.width, crop.height
    )

    function drawRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    for(const path of this.state.current.stickers) {
      if(path.type === 'text') {
        ctx.save()
        ctx.font = `${path.fontSize}px ${path.fontFamily}`
        ctx.textAlign = path.align
        ctx.strokeStyle = 'transparent'
        const measure = ctx.measureText(path.content)
        const rect = {
          x: path.position.x - 5,
          y: path.position.y - 5,
          width: measure.actualBoundingBoxRight - measure.actualBoundingBoxLeft + 10,
          height: measure.fontBoundingBoxAscent + measure.fontBoundingBoxDescent + 10,
          radius: 10
        }

        const drawTextBackground = () => {
          drawRoundedRect(rect.x, rect.y, rect.width, rect.height, rect.radius)
        }

        if(path.frame === 'none') {
          ctx.fillStyle = path.color
        } else if(path.frame === 'black') {
          ctx.fillStyle = path.color
          drawTextBackground()
          ctx.fillStyle = 'white'
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
          drawTextBackground()
          ctx.fillStyle = path.color
        }
        ctx.textBaseline = 'middle'
        ctx.fillText(path.content, path.position.x, rect.y + rect.height / 2)
        ctx.restore()
      }
    }

    return new Promise((resolve) => {
      resultCanvas.toBlob((blob) => {
        if(blob === null) {
          throw new Error('Failed to export image')
        }

        resolve(new File([blob], 'image.png', {type: 'image/png'}))
      })
    })
  }

  loadMedia(src: string) {
    this.waitingForImage = true
    this.img.src = src
  }

  updateSize(width: number, height: number) {
    this.waitingForSize = false

    this.width = width
    this.height = height

    this.pointMatcher.invalidate()
    this.requestFrame()
    this.dispatchResize()
  }

  getOriginalAspectRatio() {
    return this.img.width / this.img.height
  }

  setCropMode(cropMode: boolean) {
    if(this.cropMode === cropMode) {
      return
    }

    this.cropMode = cropMode
    this.switchModeTimer.start()
    this.requestFrame()
  }

  setDrawMode(drawMode: boolean) {
    if(this.drawMode === drawMode) {
      return
    }

    this.drawMode = drawMode
    if(drawMode) {
      this.registerDrawListeners()
    } else {
      this.unregisterDrawListeners()
    }
  }

  setTextMode(textMode: boolean) {
    if(this.textMode === textMode) {
      return
    }

    if(textMode) {
      this.registerTextListeners()
    } else {
      this.unregisterTextListeners()
    }
  }

  private createPainter = () => {
    const renderer = this
    let prevPoint: Point | null = null
    return {
      startPath(path: MediaEditorPath, point: Point) {
        if(path.tool === 'blur') {
          const bctx = renderer.blurCtx
          bctx.filter = 'blur(4px)'
          bctx.drawImage(renderer.lastBitmap, 0, 0)
          bctx.drawImage(renderer.drawCanvas, 0, 0)

          const ctx = renderer.drawCtx
          ctx.globalCompositeOperation = 'source-over'
          ctx.shadowBlur = 0
          ctx.globalAlpha = 1
        } else {
          const ctx = renderer.drawCtx
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.strokeStyle = path.color
          ctx.fillStyle = path.color
          ctx.lineWidth = path.size
          ctx.shadowBlur = 0
          ctx.globalAlpha = 1

          if(path.tool === 'brush') {
            ctx.globalAlpha = 0.7
          }

          if(path.tool === 'neon') {
            ctx.strokeStyle = 'white'
            ctx.shadowColor = path.color
            ctx.shadowBlur = path.size;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
          }

          ctx.globalCompositeOperation = 'source-over'
          if(path.tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out'
          }

          ctx.beginPath()
          ctx.moveTo(point.x, point.y)
        }
        prevPoint = point
      },
      updatePath(path: MediaEditorPath, point: Point) {
        const ctx = renderer.drawCtx
        if(path.tool === 'blur') {
          renderer.paintBlur(path)
        } else if(path.tool === 'brush') {
          const p1 = prevPoint
          const p2 = point

          ctx.beginPath()
          ctx.moveTo(
            p1.x - path.size / 2,
            p1.y - path.size / 2
          )
          ctx.lineTo(
            p1.x + path.size / 2,
            p1.y + path.size / 2
          )
          ctx.lineTo(
            p2.x + path.size / 2,
            p2.y  + path.size / 2
          )
          ctx.lineTo(
            p2.x - path.size / 2,
            p2.y - path.size / 2
          )
          ctx.fill()
        } else {
          ctx.lineTo(point.x, point.y)
          ctx.stroke()
        }
        prevPoint = point
      },
      endPath(path: MediaEditorPath) {
        if(path.tool === 'arrow') {
          const ctx = renderer.drawCtx
          const p1 = path.points.at(-1)
          const p2 = path.points.at(-2)

          const angle = Math.atan2(p1.y - p2.y, p1.x - p2.x)
          const arrowSize = path.size * 4

          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(p2.x, p2.y)
          ctx.lineTo(
            p2.x - arrowSize * Math.cos(angle - Math.PI / 6),
            p2.y - arrowSize * Math.sin(angle - Math.PI / 6)
          )
          ctx.stroke()

          ctx.beginPath()
          ctx.moveTo(p2.x, p2.y)
          ctx.lineTo(
            p2.x - arrowSize * Math.cos(angle + Math.PI / 6),
            p2.y - arrowSize * Math.sin(angle + Math.PI / 6)
          )
          ctx.stroke()
        }
      }
    }
  }

  private painter = this.createPainter()

  private registerDrawListeners() {
    const lastPath = () => {
      return this.state.current.paintings.at(-1)
    }
    this.unregisterDrawListeners = attachGrabListeners(
      this.mainCanvas,
      ({x, y}) => {
        const point = this.pointMatcher.value.toImagePoint({x, y})

        this.state.startPath({
          ...this.state.drawState,
          point
        })

        const path = lastPath()
        this.painter.startPath(path, point)
      },
      ({x, y}) => {
        const point = this.pointMatcher.value.toImagePoint({x, y})
        this.state.updatePath(point)
        const path = lastPath()
        this.painter.updatePath(path, point)
      },
      () => {
        this.state.commitDraw()
        const path = lastPath()
        this.painter.endPath(path)
      }
    )
  }

  private registerTextListeners() {
    this.unregisterTextListeners = attachClickEvent(
      this.mainCanvas,
      ({x, y}) => {
        const point = this.pointMatcher.value.toImagePoint({x, y})
        // this.state.startText(point)
      }
    )
  }

  private requestFrame() {
    if(this.waitingForFrame || this.waitingForSize || this.waitingForImage || !this.img.complete) {
      this.needsUpdate = true
      return
    }

    if(this.filtersInvalidated) {
      this.waitingForFrame = true

      createImageBitmap(this.img).then((bitmap) => {
        this.worker.postMessage({type: 'requestFrame', bitmap, values: this.values}, [bitmap])
      })
    } else {
      this.renderFrame()
    }
  }

  private lastBitmap?: ImageBitmap

  private onFrameReady(bitmap: ImageBitmap) {
    this.lastBitmap?.close()
    this.lastBitmap = bitmap

    this.renderFrame()

    this.waitingForFrame = false
    if(this.needsUpdate) {
      this.needsUpdate = false
      this.requestFrame()
    } else {
      this.filtersInvalidated = false
    }
  }

  private getImageRectAndScale(padding: number = paddingInCropMode): RectAndScale {
    const sw = this.img.width
    const sh = this.img.height

    const {width, height} = this

    // Image bounds
    const imageScale = Math.min((width - padding) / sw, (height - padding) / sh)
    const imageW = sw * imageScale
    const imageH = sh * imageScale

    const imageX = (width - imageW) / 2
    const imageY = (height - imageH) / 2

    const rect = Rect.from2Points({x: imageX, y: imageY}, {x: imageX + imageW, y: imageY + imageH})

    return {
      rect,
      scale: imageScale
    }
  }

  private renderFrame() {
    requestAnimationFrame((timestamp) => {
      this.switchModeTimer.frame(timestamp)
      this.flipTimer.frame(timestamp)

      const {rotation, transformRotation} = this.values
      const totalRotation = (rotation + transformRotation) % 360

      this.mainCanvas.width = this.width
      this.mainCanvas.height = this.height
      const ctx = this.mainCanvas.getContext('2d')

      const elapsed = this.cropMode ? 1 - this.switchModeTimer.elapsed : this.switchModeTimer.elapsed

      const renderedImage = this.getRenderedImage()
      const crop = this.values.crop
      const padding = (1 - elapsed) * paddingInCropMode

      const cropScale = Math.min((this.width - padding) / crop.width, (this.height - padding) / crop.height)

      const {
        rect: imageRect,
        scale: imageScale
      } = this.getImageRectAndScale(padding)

      imageRect.rotation = totalRotation
      const bounds = imageRect.boundingBox

      // Start rect
      const startW = crop.width * imageScale
      const startH = crop.height * imageScale

      const startX = (crop.x * imageScale - bounds.width / 2 + this.width / 2)
      const startY = (crop.y * imageScale - bounds.height / 2 + this.height / 2)

      // End rect
      const endW = crop.width * cropScale
      const endH = crop.height * cropScale

      const endX = (this.width - endW) / 2
      const endY = (this.height - endH) / 2

      const currentX = startX + (endX - startX) * elapsed
      const currentY = startY + (endY - startY) * elapsed
      const currentW = startW + (endW - startW) * elapsed
      const currentH = startH + (endH - startH) * elapsed

      const translate = {
        x: this.width / 2,
        y: this.height / 2
      }

      if(this.cropMode) {
        ctx.globalAlpha = 1 - elapsed
        ctx.drawImage(
          renderedImage.canvas,
          bounds.topLeft.x - renderedImage.shift.x * imageScale,
          bounds.topLeft.y - renderedImage.shift.y * imageScale,
          renderedImage.canvas.width * imageScale,
          renderedImage.canvas.height * imageScale
        )
        ctx.globalAlpha = 1
      }

      if(!this.cropMode || (this.cropMode && this.switchModeTimer.running)) {
        ctx.drawImage(
          renderedImage.canvas,
          crop.x + renderedImage.shift.x,
          crop.y + renderedImage.shift.y,
          crop.width,
          crop.height,
          currentX, currentY, currentW, currentH
        )
      }

      ctx.translate(translate.x, translate.y)
      ctx.rotate(totalRotation * Math.PI / 180)

      if(this.switchModeTimer.running || this.flipTimer.running) {
        this.renderFrame()
      }
    })
  }

  private getRenderedImage(): {
    canvas: HTMLCanvasElement,
    shift: {x: number, y: number}
    } {
    const sw = this.img.width
    const sh = this.img.height

    const maxSkew = 0.2

    const {rotation, transformRotation} = this.values
    const totalRotation = (rotation + transformRotation) % 360

    const imageRect = Rect.from2Points({x: 0, y: 0}, {x: sw, y: sh})
    imageRect.rotation = totalRotation
    const bounds = imageRect.boundingBox

    const canvas = document.createElement('canvas')
    canvas.width = bounds.width
    canvas.height = bounds.height + maxSkew * bounds.height // for flip animation

    const translate = {
      x: bounds.width / 2,
      y: (bounds.height + maxSkew * bounds.height) / 2
    }

    const flipElapsed = this.flipTimer.running ?
      (this.values.flip ? this.flipTimer.elapsed : 1 - this.flipTimer.elapsed) :
      (this.values.flip ? 1 : 0)

    const flipTransform = {
      // a is scale, b is skew
      a: (1 - flipElapsed) * 2 - 1, // 1 to -1
      b: (flipElapsed > 0.5 ? Math.abs(flipElapsed - 1) : flipElapsed) * 0.4 // 0 -> 0.2 -> 0
    }

    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.translate(translate.x, translate.y)
    ctx.rotate(totalRotation * Math.PI / 180)
    ctx.transform(flipTransform.a, flipTransform.b, 0, 1, 0, 0)

    ctx.drawImage(this.lastBitmap, -sw / 2, -sh / 2)

    ctx.beginPath()
    ctx.rect(-sw / 2, -sh / 2, sw, sh)
    ctx.clip()

    ctx.drawImage(this.drawCanvas, -sw / 2, -sh / 2)
    ctx.restore()

    return {
      canvas,
      shift: {
        x: 0,
        y: (maxSkew * bounds.height) / 2
      }
    }
  }
}
