import {defaultVert} from './shaders/defaultVert';
import {rgbToHsvFrag} from './shaders/rgbToHsvFrag';
import {createProgram} from './utils/createProgram.js';
import {render2d} from './utils/render.js';
import {createEmptyTexture} from './utils/texture.js';

export function createColorConvertProgram(ctx) {
  const {gl, mapVertices} = ctx

  const program = createProgram(gl, defaultVert, rgbToHsvFrag)

  const uSamplerLoc = gl.getUniformLocation(program, 'uSampler')

  const vertexPositionLoc = gl.getAttribLocation(program, 'aVertexPosition')
  const texCoordLoc = gl.getAttribLocation(program, 'aTextureCoord')

  return (input) => {
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

    mapVertices(vertexPositionLoc, texCoordLoc)

    render2d(gl)

    gl.bindTexture(gl.TEXTURE_2D, prevTexture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer)
    gl.useProgram(prevProgram)

    return outputTexture
  }
}
