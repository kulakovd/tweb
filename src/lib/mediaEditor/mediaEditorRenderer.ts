import {defaultMediaEncoderValues, MediaEncoderValues} from './mediaEncoderValues'

type WorkerEventData = {
  type: 'frameReady'
  bitmap: ImageBitmap
}

export class MediaEditorRenderer {
  private worker: Worker
  private mainCanvas: HTMLCanvasElement
  private helperCanvas: HTMLCanvasElement
  private img = new Image()

  private needsUpdate = false
  private waitingForFrame = false
  private waitingForImage = true
  private waitingForSize = true

  private width = 0
  private height = 0

  private values: MediaEncoderValues = defaultMediaEncoderValues

  constructor(canvas: HTMLCanvasElement) {
    this.img.onload = () => {
      this.waitingForImage = false
      this.requestFrame()
    }

    this.mainCanvas = canvas
    this.helperCanvas = document.createElement('canvas')

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

  updateValues(updates: Partial<MediaEncoderValues>) {
    Object.assign(this.values, updates)
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

  private onFrameReady(bitmap: ImageBitmap) {
    this.renderFrame(bitmap)
    this.waitingForFrame = false
    if(this.needsUpdate) {
      this.needsUpdate = false
      this.requestFrame()
    }
  }

  private renderFrame(bitmap: ImageBitmap) {
    requestAnimationFrame(() => {
      const sw = this.img.width
      const sh = this.img.height

      const scale = Math.min(this.width / sw, this.height / sh)
      const dw = sw * scale
      const dh = sh * scale

      const dx = (this.width - dw) / 2
      const dy = (this.height - dh) / 2

      this.mainCanvas.width = this.width
      this.mainCanvas.height = this.height
      const ctx = this.mainCanvas.getContext('2d')
      ctx.drawImage(bitmap, 0, 0, sw, sh, dx, dy, dw, dh)
      bitmap.close()
    })
  }

  private getImageData(image: HTMLImageElement): ImageData {
    const canvas = this.helperCanvas
    const ctx = canvas.getContext('2d')
    canvas.width = image.width
    canvas.height = image.height
    ctx.drawImage(image, 0, 0)
    return ctx.getImageData(0, 0, image.width, image.height)
  }
}
