import {defaultMediaEncoderValues, MediaEditorValues} from './mediaEditorValues'
import {Rect} from './geometry'

type WorkerEventData = {
  type: 'frameReady'
  bitmap: ImageBitmap
}

type RectAndScale = {x: number, y: number, width: number, height: number, scale: number}

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
  public onResize: (image: RectAndScale) => void

  private worker: Worker
  private mainCanvas: HTMLCanvasElement
  private img = new Image()

  private needsUpdate = false
  private waitingForFrame = false
  private waitingForImage = true
  private waitingForSize = true

  private width = 0
  private height = 0

  private values: MediaEditorValues = defaultMediaEncoderValues

  private switchModeTimer = new AnimationTimer(500)
  private flipTimer = new AnimationTimer(500)

  private cropMode = false

  private dispatchResize = () => {
    if(this.waitingForImage || this.waitingForSize) {
      return
    }

    const kek = this.getImageRectAndScale()

    let rect = Rect.from2Points({x: kek.x, y: kek.y}, {x: kek.x + kek.width, y: kek.y + kek.height})
    rect.rotation = this.values.transformRotation
    rect = rect.boundingBox

    this.onResize?.({
      x: rect.topLeft.x,
      y: rect.topLeft.y,
      width: rect.width,
      height: rect.height,
      scale: kek.scale
    })
  }

  constructor(canvas: HTMLCanvasElement) {
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
  }

  loadMedia(src: string) {
    this.waitingForImage = true
    this.img.src = src
  }

  updateSize(width: number, height: number) {
    this.waitingForSize = false

    this.width = width
    this.height = height

    this.requestFrame()
    this.dispatchResize()
  }

  getValues() {
    return this.values
  }

  flip() {
    if(!this.flipTimer.running) {
      this.flipTimer.start()
      this.updateValues({flip: !this.values.flip})
    }
  }

  updateValues(updates: Partial<MediaEditorValues>) {
    const transformRotationUpdated = updates.transformRotation !== undefined &&
      this.values.transformRotation !== updates.transformRotation
    Object.assign(this.values, updates)
    if(transformRotationUpdated) {
      this.dispatchResize()
    }
    this.requestFrame()
  }

  getOriginalAspectRatio() {
    return this.img.width / this.img.height
  }

  setCropMode(cropMode: boolean) {
    if(this.cropMode === cropMode) {
      return
    }

    this.cropMode = cropMode
    if(cropMode) {
      this.switchModeTimer.start()
    } else {
      this.switchModeTimer.start()
    }
    this.requestFrame()
  }

  private requestFrame() {
    if(this.waitingForFrame || this.waitingForSize || this.waitingForImage || !this.img.complete) {
      this.needsUpdate = true
      return
    }

    this.waitingForFrame = true

    createImageBitmap(this.img).then((bitmap) => {
      this.worker.postMessage({type: 'requestFrame', bitmap, values: this.values}, [bitmap])
    })
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

    return {
      x: imageX,
      y: imageY,
      width: imageW,
      height: imageH,
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

      const rotatedImage = this.getRotatedImage()
      const crop = this.values.crop
      const padding = (1 - elapsed) * paddingInCropMode

      const cropScale = Math.min((this.width - padding) / crop.width, (this.height - padding) / crop.height)

      const {
        x: imageX,
        y: imageY,
        width: imageW,
        height: imageH,
        scale: imageScale
      } = this.getImageRectAndScale(padding)

      const imageRect = Rect.from2Points({x: 0, y: 0}, {x: imageW, y: imageH})
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

      const flipElapsed = this.flipTimer.running ?
        (this.values.flip ? this.flipTimer.elapsed : 1 - this.flipTimer.elapsed) :
        (this.values.flip ? 1 : 0)

      const flipTransform = {
        a: (1 - flipElapsed) * 2 - 1, // 1 to -1
        b: (flipElapsed > 0.5 ? Math.abs(flipElapsed - 1) : flipElapsed) * 0.4 // 0 -> 0.2 -> 0
      }

      if(this.cropMode) {
        const translate = {
          x: this.width / 2,
          y: this.height / 2
        }

        ctx.save()
        ctx.globalAlpha = 1 - elapsed
        ctx.translate(translate.x, translate.y)
        ctx.rotate(totalRotation * Math.PI / 180)
        ctx.transform(flipTransform.a, flipTransform.b, 0, 1, 0, 0)
        ctx.drawImage(this.lastBitmap, imageX - translate.x, imageY - translate.y, imageW, imageH)
        ctx.restore()
      }

      if(!this.cropMode || (this.cropMode && this.switchModeTimer.running)) {
        ctx.drawImage(
          rotatedImage,
          crop.x, crop.y, crop.width, crop.height,
          currentX, currentY, currentW, currentH
        )
      }

      if(this.switchModeTimer.running || this.flipTimer.running) {
        this.renderFrame()
      }
    })
  }

  private getRotatedImage(): HTMLCanvasElement {
    const sw = this.img.width
    const sh = this.img.height

    const {rotation, transformRotation} = this.values
    const totalRotation = (rotation + transformRotation) % 360

    const imageRect = Rect.from2Points({x: 0, y: 0}, {x: sw, y: sh})
    imageRect.rotation = totalRotation
    const bounds = imageRect.boundingBox

    const canvas = document.createElement('canvas')
    canvas.width = bounds.width
    canvas.height = bounds.height

    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.translate(bounds.width / 2, bounds.height / 2)
    ctx.rotate(totalRotation * Math.PI / 180)
    if(this.values.flip) {
      ctx.transform(-1, 0, 0, 1, 0, 0)
    }

    ctx.drawImage(this.lastBitmap, -sw / 2, -sh / 2)
    ctx.restore()

    return canvas
  }
}
