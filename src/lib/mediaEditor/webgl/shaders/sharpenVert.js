// language=GLSL
export const sharpenVert = `
  #version 300 es 

  uniform highp float inputWidth;
  uniform highp float inputHeight;
  
  in vec4 position;
  in vec2 inputTexCoord;

  out vec2 vTextureCoord;
  
  out vec2 leftTexCoord;
  out vec2 rightTexCoord;
  out vec2 topTexCoord;
  out vec2 bottomTexCoord;

  void main() {
    gl_Position = position;
    vTextureCoord = inputTexCoord;
    
    highp vec2 widthStep = vec2(1.0 / inputWidth, 0.0);
    highp vec2 heightStep = vec2(0.0, 1.0 / inputHeight);
    
    leftTexCoord = inputTexCoord - widthStep;
    rightTexCoord = inputTexCoord + widthStep;
    topTexCoord = inputTexCoord + heightStep;
    bottomTexCoord = inputTexCoord - heightStep;
  }
`.trim();
