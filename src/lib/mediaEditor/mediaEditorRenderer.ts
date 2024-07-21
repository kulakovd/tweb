import {defaultMediaEncoderValues, MediaEditorValues} from './mediaEditorValues'

type WorkerEventData = {
  type: 'frameReady'
  bitmap: ImageBitmap
}

class Animation {
  private _running = false
  private duration: number

  private startTime: number | null = null

  private startValue: number
  private currentValue: number
  private targetValue: number

  constructor(duration: number, value: number = 0) {
    this.duration = duration
    this.startValue = value
    this.currentValue = value
  }

  update(targetValue: number) {
    this._running = true
    this.startTime = null
    this.startValue = this.currentValue
    this.targetValue = targetValue
  }

  animate(timestamp: number) {
    if(!this._running) {
      return
    }

    if(this.startTime === null) {
      this.startTime = timestamp
    }

    const elapsed = (timestamp - this.startTime) / this.duration
    this.currentValue = this.startValue + (this.targetValue - this.startValue) * elapsed
    if(elapsed >= 1) {
      this.currentValue = this.targetValue
      this._running = false
    }
  }

  get current() {
    return this.currentValue
  }

  get running() {
    return this._running
  }
}

export class MediaEditorRenderer {
  public onRenderFrame: (x: number, y: number, w: number, h: number, values: MediaEditorValues) => void

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

  private verticalPadding = new Animation(500, 0)

  private animations: Animation[] = [this.verticalPadding]

  constructor(canvas: HTMLCanvasElement) {
    this.img.onload = () => {
      this.waitingForImage = false
      this.requestFrame()
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
  }

  updateValues(updates: Partial<MediaEditorValues>) {
    Object.assign(this.values, updates)
    this.requestFrame()
  }

  updatePadding(padding: number) {
    this.verticalPadding.update(padding)
    this.requestFrame()
  }

  getOriginalAspectRatio() {
    return this.img.width / this.img.height
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

  private renderFrame() {
    requestAnimationFrame((timestamp) => {
      this.animations.forEach((animation) => animation.animate(timestamp))

      const sw = this.img.width
      const sh = this.img.height

      const padding = this.verticalPadding.current
      const scale = Math.min((this.width) / sw, (this.height - padding) / sh)
      const dw = sw * scale
      const dh = sh * scale

      const dx = (this.width - dw) / 2
      const dy = (this.height - dh) / 2

      this.onRenderFrame?.(dx, dy, dw, dh, this.values)

      this.mainCanvas.width = this.width
      this.mainCanvas.height = this.height
      const ctx = this.mainCanvas.getContext('2d')

      ctx.save()

      const translateX = this.width / 2
      const translateY = this.height / 2

      ctx.translate(translateX, translateY);
      ctx.rotate(this.values.rotation * Math.PI / 180)

      ctx.drawImage(this.lastBitmap, 0, 0, sw, sh, dx - translateX, dy - translateY, dw, dh)

      ctx.restore()

      if(this.animations.some((animation) => animation.running)) {
        this.renderFrame()
      }
    })
  }
}
