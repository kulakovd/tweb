// --isolated-modules
import {enhancePass} from './processors/enhancePass'
import {MediaEncoderValues} from './mediaEncoderValues'
import {createImageTexture} from './webgl/utils/imageTexture'
import {Texture} from './webgl/webgl'
import {createDefaultProgram} from './webgl/defaultProgram'
import {createVertexBuffer} from './webgl/vertex'
import {render2d} from './webgl/utils/render'

export {}

type EvtData = {
  type: 'requestFrame'
  bitmap: ImageBitmap
  values: MediaEncoderValues
}

const canvas = new OffscreenCanvas(1, 1)
const gl = canvas.getContext('webgl2') as WebGL2RenderingContext

const vertexBuffer = createVertexBuffer(gl)
const defaultProgram = createDefaultProgram(gl, vertexBuffer)
function renderToCanvas(texture: Texture) {
  const prevFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
  const prevTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
  const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM);

  defaultProgram.use()

  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture.texture)

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, canvas.width, canvas.height)

  canvas.width = texture.width
  canvas.height = texture.height
  render2d(gl)

  gl.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer)
  gl.bindTexture(gl.TEXTURE_2D, prevTexture)
  gl.useProgram(prevProgram)
}

function renderFrame(bitmap: ImageBitmap, values: MediaEncoderValues) {
  const image = createImageTexture(gl, bitmap)
  const enhanced = enhancePass(gl, image, values)
  renderToCanvas(enhanced)
  return createImageBitmap(canvas)
}

addEventListener('message', (event) => {
  const data: EvtData = event.data

  switch(data.type) {
    case 'requestFrame':
      renderFrame(data.bitmap, data.values).then((imageBitmap) => {
        postMessage({type: 'frameReady', bitmap: imageBitmap}, [imageBitmap])
      })
      break
  }
})
