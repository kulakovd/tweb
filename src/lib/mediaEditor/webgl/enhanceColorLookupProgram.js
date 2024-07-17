import {createProgram} from './utils/createProgram.js';
import {mapVertices} from './vertex.js';
import {render2d} from './utils/render.js';
import {createEmptyTexture} from './utils/texture.js';
import {defaultVert} from './shaders/defaultVert';
import {enhanceColorLookupFrag} from './shaders/enhanceColorLookupFrag';

export function createEnhanceColorLookupProgram(gl, vertexBuffer) {
  const program = createProgram(gl, defaultVert, enhanceColorLookupFrag)

  const colorSamplerLoc = gl.getUniformLocation(program, 'inputSampler')
  const lutSamplerLoc = gl.getUniformLocation(program, 'lutSampler')

  const intensityLoc = gl.getUniformLocation(program, 'intensity')

  const vertexPositionLoc = gl.getAttribLocation(program, 'aVertexPosition')
  const texCoordLoc = gl.getAttribLocation(program, 'aTextureCoord')

  return (params) => {
    const {input, lutTexture, intensity} = params

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

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, lutTexture)

    gl.uniform1i(colorSamplerLoc, 0) // texture unit 0
    gl.uniform1i(lutSamplerLoc, 1) // texture unit 1

    gl.uniform1f(intensityLoc, intensity)

    mapVertices(gl, vertexBuffer, vertexPositionLoc, texCoordLoc)

    render2d(gl)

    gl.bindTexture(gl.TEXTURE_2D, prevTexture)
    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer)
    gl.useProgram(prevProgram)

    return outputTexture
  }
}
