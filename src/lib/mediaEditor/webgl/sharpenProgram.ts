import {MediaEditorRenderingContext} from './context'
import {createProgram} from './utils/createProgram'
import {sharpenVert} from './shaders/sharpenVert'
import {sharpenFrag} from './shaders/sharpenFrag'
import {Texture} from './webgl'
import {createEmptyTexture} from './utils/texture'

export const createSharpenProgram = (ctx: MediaEditorRenderingContext) => {
  const {gl, mapVertices} = ctx

  const program = createProgram(gl, sharpenVert, sharpenFrag)

  const vertexPositionLoc = gl.getAttribLocation(program, 'position')
  const texCoordLoc = gl.getAttribLocation(program, 'inputTexCoord')

  const uSamplerLoc = gl.getUniformLocation(program, 'sTexture')

  const inputWidthLoc = gl.getUniformLocation(program, 'inputWidth')
  const inputHeightLoc = gl.getUniformLocation(program, 'inputHeight')

  const sharpenLoc = gl.getUniformLocation(program, 'sharpen')

  return ({input, sharpen}: {
    input: Texture,
    sharpen: number
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

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, input.texture)

    gl.uniform1i(uSamplerLoc, 0)

    gl.uniform1f(inputWidthLoc, input.width)
    gl.uniform1f(inputHeightLoc, input.height)

    gl.uniform1f(sharpenLoc, sharpen)

    mapVertices(vertexPositionLoc, texCoordLoc)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    gl.bindTexture(gl.TEXTURE_2D, prevTexture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer)
    gl.useProgram(prevProgram)

    return outputTexture
  }
}
