// language=GLSL
export const defaultVert = `
  #version 300 es
  
  in vec2 aTextureCoord;
  in vec4 aVertexPosition;
  
  out highp vec2 texCoord;
  
  void main() {
    gl_Position = aVertexPosition;
    texCoord = aTextureCoord;
  }
`.trim();
