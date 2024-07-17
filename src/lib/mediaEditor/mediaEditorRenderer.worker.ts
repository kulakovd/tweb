// --isolated-modules
import {MediaEncoderValues} from './mediaEncoderValues'
import {createImageTexture} from './webgl/utils/imageTexture'
import {Texture} from './webgl/webgl'
import {createDefaultProgram} from './webgl/defaultProgram'
import {initVertices} from './webgl/vertex'
import {render2d} from './webgl/utils/render'
import {MediaEditorRenderingContext} from './webgl/context'
import {createEnhancePass} from './processors/enhancePass'
import {createAdjustmentsPass} from './processors/adjustmentsPass'
import {createSharpenPass} from './processors/sharpenPass'

export {}

type EvtData = {
  type: 'requestFrame'
  bitmap: ImageBitmap
  values: MediaEncoderValues
}

const canvas = new OffscreenCanvas(1, 1)
const gl = canvas.getContext('webgl2') as WebGL2RenderingContext

const vertices = initVertices(gl)

const ctx: MediaEditorRenderingContext = {
  gl,
  mapVertices: (vLoc: number, tLoc: number, r: 'direct' | 'invert' = 'direct') => {
    gl.bindBuffer(gl.ARRAY_BUFFER, r === 'direct' ? vertices.direct() : vertices.invert())
    gl.enableVertexAttribArray(vLoc)
    gl.vertexAttribPointer(vLoc, 2, gl.FLOAT, false, 8, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, vertices.tex())
    gl.enableVertexAttribArray(tLoc)
    gl.vertexAttribPointer(tLoc, 2, gl.FLOAT, false, 8, 0)
  }
}

const defaultProgram = createDefaultProgram(ctx, 'direct')
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

const enhancePass = createEnhancePass(ctx)
const adjustmentsPass = createAdjustmentsPass(ctx)
const sharpenPass = createSharpenPass(ctx)

function renderFrame(bitmap: ImageBitmap, values: MediaEncoderValues) {
  const image = createImageTexture(gl, bitmap)
  const enhanced = enhancePass(image, values)
  const adjusted = adjustmentsPass(enhanced, values);
  const sharpened = sharpenPass(adjusted, values)
  renderToCanvas(sharpened)
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
