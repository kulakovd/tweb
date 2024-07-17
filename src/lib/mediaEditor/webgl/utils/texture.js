export function createEmptyTexture(gl, width, height, params = {}) {
  const {
    internalFormat = gl.RGBA,
    format = gl.RGBA,
    minFilter = gl.LINEAR,
    magFilter = gl.LINEAR,
    // S is for horizontal, T is for vertical (X and Y respectively)
    wrapS = gl.CLAMP_TO_EDGE,
    wrapT = gl.CLAMP_TO_EDGE
  } = params

  const outputTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, outputTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, gl.UNSIGNED_BYTE, null)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT)

  return outputTexture
}
