export function createProgram(gl, vertSource, fragSource) {
  const vertShader = gl.createShader(gl.VERTEX_SHADER)
  gl.shaderSource(vertShader, vertSource)
  gl.compileShader(vertShader)

  if(!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    console.error('Error compiling vertex shader: ' + gl.getShaderInfoLog(vertShader));
    gl.deleteShader(vertShader);
    return null;
  }

  const fragShader = gl.createShader(gl.FRAGMENT_SHADER)
  gl.shaderSource(fragShader, fragSource)
  gl.compileShader(fragShader)

  if(!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    console.error('Error compiling fragment shader: ' + gl.getShaderInfoLog(fragShader));
    gl.deleteShader(fragShader);
    return null;
  }

  const program = gl.createProgram()
  gl.attachShader(program, vertShader)
  gl.attachShader(program, fragShader)
  gl.linkProgram(program)

  if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Error linking program: ' + gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program
}
