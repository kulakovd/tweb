// language=GLSL
export const sharpenFrag = `
  #version 300 es 
  precision highp float;
  
  uniform sampler2D sTexture;
  uniform float sharpen;

  in vec2 vTextureCoord;
  in vec2 leftTexCoord;
  in vec2 rightTexCoord;
  in vec2 topTexCoord;
  in vec2 bottomTexCoord;
  
  out vec4 fragColor;

  void main() {
    vec4 result = texture(sTexture, vTextureCoord);

    vec3 leftTextureColor = texture(sTexture, leftTexCoord).rgb;
    vec3 rightTextureColor = texture(sTexture, rightTexCoord).rgb;
    vec3 topTextureColor = texture(sTexture, topTexCoord).rgb;
    vec3 bottomTextureColor = texture(sTexture, bottomTexCoord).rgb;
    
    result.rgb = result.rgb * (1.0 + 4.0 * sharpen) - (leftTextureColor + rightTextureColor + topTextureColor + bottomTextureColor) * sharpen;

    fragColor = result;
  }
`.trim();
