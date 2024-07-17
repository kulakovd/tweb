import {adjustmentsFrag} from './shaders/adjustmentsFrag';
import {defaultVert} from './shaders/defaultVert';
import {createProgram} from './utils/createProgram';
import {createEmptyTexture} from './utils/texture';
import {render2d} from './utils/render';
import {Texture} from './webgl'
import {MediaEditorRenderingContext} from './context'

const floatParams = [
  'width',
  'height',
  'exposure',
  'contrast',
  'saturation',
  'warmth',
  'fadeAmount',
  'highlights',
  'shadows',
  'vignette',
  'grain'
] as const

type AdjustmentsParams = {
  [key in typeof floatParams[number]]: number
}

export const createAdjustmentsProgram = (ctx: MediaEditorRenderingContext) => {
  const {gl, mapVertices} = ctx

  const program = createProgram(gl, defaultVert, adjustmentsFrag)

  const vertexPositionLoc = gl.getAttribLocation(program, 'aVertexPosition')
  const texCoordLoc = gl.getAttribLocation(program, 'aTextureCoord')

  const uSamplerLoc = gl.getUniformLocation(program, 'sTexture')

  // curvesImage

  const skipToneLoc = gl.getUniformLocation(program, 'skipTone')

  // shadowsTintIntensity
  // shadowsTintColor
  // highlightsTintIntensity
  // highlightsTintColor

  const floatsLocs = floatParams.map(param => gl.getUniformLocation(program, param))

  return ({input, params}: {
    input: Texture,
    params: AdjustmentsParams
  }) => {
    const prevTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
    const prevFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    const prevProgram = gl.getParameter(gl.CURRENT_PROGRAM);

    gl.useProgram(program)

    const outputTexture = createEmptyTexture(gl, input.width, input.height)

    const framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0)
    gl.viewport(0, 0, input.width, input.height)

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, input.texture)

    gl.uniform1i(uSamplerLoc, 0) // texture unit 0

    floatParams.forEach((param, i) => {
      gl.uniform1f(floatsLocs[i], params[param])
    })

    gl.uniform1f(skipToneLoc, 1)

    mapVertices(vertexPositionLoc, texCoordLoc)

    render2d(gl)

    gl.bindTexture(gl.TEXTURE_2D, prevTexture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer)
    gl.useProgram(prevProgram)

    return outputTexture
  }
}
