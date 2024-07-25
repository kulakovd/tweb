import {defaultMediaEncoderValues, MediaEditorValues} from './mediaEditorValues'
import {Point, Rect} from './geometry'
import {MediaEditorState} from './mediaEditorState'
import attachGrabListeners from '../../helpers/dom/attachGrabListeners'

type WorkerEventData = {
  type: 'frameReady'
  bitmap: ImageBitmap
}

type RectAndScale = {rect: Rect, scale: number}
type OnResizeEvent = RectAndScale & {isRestored: boolean}

class Lazy {
  private _value: any
  private getter: () => any

  constructor(getter: () => any) {
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

  private filtersInvalidated = true

  /** User draws on cropped image but points must be in original image coordinates */
  private screenPointToImagePoint = new Lazy(() => {
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

    return (point: Point) => {
      return bounds.unrotatePoint({
        x: (point.x - cropX) / cropScale + crop.x,
        y: (point.y - cropY) / cropScale + crop.y
      })
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
        this.screenPointToImagePoint.invalidate()
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
  }

  loadMedia(src: string) {
    this.waitingForImage = true
    this.img.src = src
  }

  updateSize(width: number, height: number) {
    this.waitingForSize = false

    this.width = width
    this.height = height

    this.screenPointToImagePoint.invalidate()
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

  private registerDrawListeners() {
    this.unregisterDrawListeners = attachGrabListeners(
      this.mainCanvas,
      ({x, y}) => {
        this.state.startPath({
          tool: 'pen',
          color: '#c0392b',
          size: 5,
          point: this.screenPointToImagePoint.value({x, y})
        })
      },
      ({x, y}) => {
        this.state.updatePath(this.screenPointToImagePoint.value({x, y}))
      },
      () => {
        this.state.commitDraw()
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

    this.state.current.draw.forEach((draw) => {
      if(draw.type === 'path') {
        ctx.strokeStyle = draw.color
        ctx.lineWidth = draw.size
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        draw.points.forEach((point, index) => {
          const x = point.x - sw / 2
          const y = point.y - sh / 2
          if(index === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        })
        ctx.stroke()
      }
    })
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
