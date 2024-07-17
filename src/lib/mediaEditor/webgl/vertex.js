import {lazy} from './utils/lazy';

const directVertices = new Float32Array([
  -1.0,  1.0,
  1.0,  1.0,
  -1.0, -1.0,
  1.0, -1.0
]);

// for flipping the image horizontally
const invertVertices = new Float32Array([
  -1.0,  -1.0,
  1.0, -1.0,
  -1.0, 1.0,
  1.0, 1.0
]);

const texVertices = new Float32Array([
  0.0, 0.0,
  1.0, 0.0,
  0.0, 1.0,
  1.0, 1.0
]);

function createVertexBuffer(gl, vertices) {
  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
  return vertexBuffer
}

export const initVertices = (gl) => ({
  direct: lazy(() => createVertexBuffer(gl, directVertices)),
  invert: lazy(() => createVertexBuffer(gl, invertVertices)),
  tex: lazy(() => createVertexBuffer(gl, texVertices))
});
