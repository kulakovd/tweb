// language=GLSL
export const defaultFrag = `
  #version 300 es
  
  precision mediump float;
  
  uniform sampler2D uSampler;
  
  in highp vec2 texCoord;
  
  out vec4 fragColor;
  
  void main() {
      fragColor = texture(uSampler, texCoord);
  }
`.trim();
