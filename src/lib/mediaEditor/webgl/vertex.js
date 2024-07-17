const vertices = new Float32Array([
  -1.0,  1.0,  0.0, 0.0,
  -1.0, -1.0,  0.0, 1.0,
  1.0,  1.0,  1.0, 0.0,
  1.0, -1.0,  1.0, 1.0
]);

export function createVertexBuffer(gl) {
  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
  return vertexBuffer
}

export function mapVertices(gl, vertexBuffer, vertexPositionLoc, texCoordLoc) {
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)

  gl.enableVertexAttribArray(vertexPositionLoc)
  gl.enableVertexAttribArray(texCoordLoc)

  gl.vertexAttribPointer(vertexPositionLoc, 2, gl.FLOAT, false, 16, 0)
  gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8)
}
