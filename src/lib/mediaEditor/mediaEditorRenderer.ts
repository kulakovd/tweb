type WorkerEventData = {
  type: 'frameReady'
  imageData: ImageData
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
          this.onFrameReady(data.imageData)
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

  private requestFrame() {
    if(this.waitingForFrame || this.waitingForSize || this.waitingForImage || !this.img.complete) {
      this.needsUpdate = true
      return
    }

    this.waitingForFrame = true
    const imageData = this.getImageData(this.img)
    this.worker.postMessage({type: 'requestFrame', imageData}, [imageData.data.buffer])
  }

  private onFrameReady(imageData: ImageData) {
    this.renderFrame(imageData)
    this.waitingForFrame = false
    if(this.needsUpdate) {
      this.needsUpdate = false
      this.requestFrame()
    }
  }

  private renderFrame(imageData: ImageData) {
    requestAnimationFrame(() => {
      const sw = this.img.width
      const sh = this.img.height

      const scale = Math.min(this.width / sw, this.height / sh)
      const dw = sw * scale
      const dh = sh * scale

      const dx = (this.width - dw) / 2
      const dy = (this.height - dh) / 2

      // TODO maybe scale in advance before sending to worker?
      // scale image to fit canvas
      this.helperCanvas.width = sw
      this.helperCanvas.height = sh
      const helperCtx = this.helperCanvas.getContext('2d')
      helperCtx.putImageData(imageData, 0, 0)

      this.mainCanvas.width = this.width
      this.mainCanvas.height = this.height
      const ctx = this.mainCanvas.getContext('2d')
      ctx.drawImage(this.helperCanvas, 0, 0, sw, sh, dx, dy, dw, dh)
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
