import {createProgram} from './utils/createProgram';
import {defaultVert} from './shaders/defaultVert';
import {defaultFrag} from './shaders/defaultFrag';

export function createDefaultProgram(ctx, vertexDirection) {
  const {gl, mapVertices} = ctx

  const program = createProgram(gl, defaultVert, defaultFrag)

  const uSamplerLoc = gl.getUniformLocation(program, 'uSampler')
  const vertexPositionLoc = gl.getAttribLocation(program, 'aVertexPosition')
  const texCoordLoc = gl.getAttribLocation(program, 'aTextureCoord')

  function use() {
    gl.useProgram(program)
    gl.uniform1i(uSamplerLoc, 0) // texture unit 0
    mapVertices(vertexPositionLoc, texCoordLoc, vertexDirection)
  }

  return {
    program,
    use
  }
}
