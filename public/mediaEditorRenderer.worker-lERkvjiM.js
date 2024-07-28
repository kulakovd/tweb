function k(t,e){const o=t.getParameter(t.TEXTURE_BINDING_2D),r=t.createTexture();return t.bindTexture(t.TEXTURE_2D,r),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.bindTexture(t.TEXTURE_2D,o),{texture:r,width:e.width,height:e.height}}function A(t,e,o){const r=t.createShader(t.VERTEX_SHADER);if(t.shaderSource(r,e),t.compileShader(r),!t.getShaderParameter(r,t.COMPILE_STATUS))return console.error("Error compiling vertex shader: "+t.getShaderInfoLog(r)),t.deleteShader(r),null;const a=t.createShader(t.FRAGMENT_SHADER);if(t.shaderSource(a,o),t.compileShader(a),!t.getShaderParameter(a,t.COMPILE_STATUS))return console.error("Error compiling fragment shader: "+t.getShaderInfoLog(a)),t.deleteShader(a),null;const n=t.createProgram();return t.attachShader(n,r),t.attachShader(n,a),t.linkProgram(n),t.getProgramParameter(n,t.LINK_STATUS)?n:(console.error("Error linking program: "+t.getProgramInfoLog(n)),t.deleteProgram(n),null)}const C=`
  #version 300 es
  
  in vec2 aTextureCoord;
  in vec4 aVertexPosition;
  
  out highp vec2 texCoord;
  
  void main() {
    gl_Position = aVertexPosition;
    texCoord = aTextureCoord;
  }
`.trim(),W=`
  #version 300 es
  
  precision mediump float;
  
  uniform sampler2D uSampler;
  
  in highp vec2 texCoord;
  
  out vec4 fragColor;
  
  void main() {
      fragColor = texture(uSampler, texCoord);
  }
`.trim();function j(t,e){const{gl:o,mapVertices:r}=t,a=A(o,C,W),n=o.getUniformLocation(a,"uSampler"),c=o.getAttribLocation(a,"aVertexPosition"),u=o.getAttribLocation(a,"aTextureCoord");function p(){o.useProgram(a),o.uniform1i(n,0),r(c,u,e)}return{program:a,use:p}}function I(t){let e=null;return()=>(e===null&&(e=t()),e)}const Y=new Float32Array([-1,1,1,1,-1,-1,1,-1]),J=new Float32Array([-1,-1,1,-1,-1,1,1,1]),Q=new Float32Array([0,0,1,0,0,1,1,1]);function S(t,e){const o=t.createBuffer();return t.bindBuffer(t.ARRAY_BUFFER,o),t.bufferData(t.ARRAY_BUFFER,e,t.STATIC_DRAW),o}const Z=t=>({direct:I(()=>S(t,Y)),invert:I(()=>S(t,J)),tex:I(()=>S(t,Q))});function L(t){t.clearColor(0,0,0,1),t.clear(t.COLOR_BUFFER_BIT),t.drawArrays(t.TRIANGLE_STRIP,0,4)}function $(t,e,o,r){const a=o*r,n=1.25;return c=>{const u=t.getParameter(t.TEXTURE_BINDING_2D),p=t.getParameter(t.FRAMEBUFFER_BINDING),f=t.createFramebuffer();t.bindFramebuffer(t.FRAMEBUFFER,f),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,c.texture,0),t.viewport(0,0,c.width,c.height);const h=new Uint8Array(c.width*c.height*4);t.readPixels(0,0,c.width,c.height,t.RGBA,t.UNSIGNED_BYTE,h);const d=Math.floor(c.width/o),g=Math.floor(c.height/r),E=d*g,v=Math.floor(Math.max(1,n*E/e)),R=255/E,b=c.width*4,T=Array.from({length:a},()=>new Uint32Array(e)),_=Array.from({length:a}),M=Array.from({length:a},()=>0),X=Array.from({length:a},()=>0),O=o/c.width,q=r/c.height;for(let s=0;s<c.height;s++){const w=s*b;for(let x=0;x<c.width;x++){const l=x*4+w,F=Math.floor(x*O),m=Math.floor(s*q)*o+F,H=h[l+2];T[m][H]++}}for(let s=0;s<a;s++){if(v>0){let l=0;for(let m=0;m<e;++m)T[s][m]>v&&(l+=Math.floor(T[s][m]-v),T[s][m]=v);const F=Math.floor(l/e),z=l-F*e;for(let m=0;m<e;++m)T[s][m]+=F;for(let m=0;m<z;++m)T[s][m]++}_[s]=T[s].slice(0);let w=e-1;for(let l=0;l<w;++l)_[s][l]!==0&&(w=l);let x=0;for(let l=w;l<e;++l)x+=_[s][l],_[s][l]=Math.floor(Math.min(255,x*R));M[s]=_[s][w],X[s]=_[s][e-1]}const V=4*e*a,K=4*e,P=new Uint8Array(V);for(let s=0;s<a;s++){const w=s*K;for(let x=0;x<e;x++){const l=x*4+w;P[l]=_[s][x],P[l+1]=M[s],P[l+2]=X[s]}}const N=t.createTexture();return t.bindTexture(t.TEXTURE_2D,N),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,e,a,0,t.RGBA,t.UNSIGNED_BYTE,P),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.bindFramebuffer(t.FRAMEBUFFER,p),t.bindTexture(t.TEXTURE_2D,u),N}}function y(t,e,o,r={}){const{internalFormat:a=t.RGBA,format:n=t.RGBA,minFilter:c=t.LINEAR,magFilter:u=t.LINEAR,wrapS:p=t.CLAMP_TO_EDGE,wrapT:f=t.CLAMP_TO_EDGE}=r,h=t.createTexture();return t.bindTexture(t.TEXTURE_2D,h),t.texImage2D(t.TEXTURE_2D,0,a,e,o,0,n,t.UNSIGNED_BYTE,null),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,c),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,u),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,p),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,f),h}const ee=`
  #version 300 es
  
  precision highp float;
  
  uniform sampler2D inputSampler;
  uniform sampler2D lutSampler;
  uniform float intensity;
  
  in highp vec2 texCoord;
  
  out vec4 fragColor;
  
  vec3 rgb_to_hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
      vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);
  
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }
  
  vec3 hsv_to_rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  
  float enhance(float value) {
      const vec2 offset = vec2(0.001953125, 0.03125); // vec2(0.5 / 256.0, 0.5 / 16.0)
      value = value + offset.x;
  
      vec2 coord = (clamp(texCoord, 0.125, 1.0 - 0.125001) - 0.125) * 4.0;
      vec2 frac = fract(coord);
      coord = floor(coord); // vec2(0..3, 0..3)
  
      // 1.0 / 16.0 = 0.0625
      float p00 = float(coord.y * 4.0 + coord.x) * 0.0625 + offset.y;
      float p01 = float(coord.y * 4.0 + coord.x + 1.0) * 0.0625 + offset.y;
      float p10 = float((coord.y + 1.0) * 4.0 + coord.x) * 0.0625 + offset.y;
      float p11 = float((coord.y + 1.0) * 4.0 + coord.x + 1.0) * 0.0625 + offset.y;
  
      vec3 c00 = texture(lutSampler, vec2(value, p00)).rgb;
      vec3 c01 = texture(lutSampler, vec2(value, p01)).rgb;
      vec3 c10 = texture(lutSampler, vec2(value, p10)).rgb;
      vec3 c11 = texture(lutSampler, vec2(value, p11)).rgb;
  
      // r - cdf, g - cdfMin, b - cdfMax
      float c1 = ((c00.r - c00.g) / (c00.b - c00.g));
      float c2 = ((c01.r - c01.g) / (c01.b - c01.g));
      float c3 = ((c10.r - c10.g) / (c10.b - c10.g));
      float c4 = ((c11.r - c11.g) / (c11.b - c11.g));
  
      float c1_2 = mix(c1, c2, frac.x);
      float c3_4 = mix(c3, c4, frac.x);
  
      return mix(c1_2, c3_4, frac.y);
  }
  
  void main() {
      vec4 texel = texture(inputSampler, texCoord);
      vec4 hsv = texel;
  
      hsv.y = min(1.0, hsv.y * 1.2);
      hsv.z = min(1.0, enhance(hsv.z) * 1.1);
  
      fragColor = vec4(hsv_to_rgb(mix(texel.xyz, hsv.xyz, intensity)), texel.w);
  }
`.trim();function te(t){const{gl:e,mapVertices:o}=t,r=A(e,C,ee),a=e.getUniformLocation(r,"inputSampler"),n=e.getUniformLocation(r,"lutSampler"),c=e.getUniformLocation(r,"intensity"),u=e.getAttribLocation(r,"aVertexPosition"),p=e.getAttribLocation(r,"aTextureCoord");return f=>{const{input:h,lutTexture:d,intensity:g}=f,E=e.getParameter(e.TEXTURE_BINDING_2D),v=e.getParameter(e.FRAMEBUFFER_BINDING),R=e.getParameter(e.CURRENT_PROGRAM);e.useProgram(r);const b=y(e,h.width,h.height),T=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,T),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,b,0),e.viewport(0,0,h.width,h.height),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,h.texture),e.activeTexture(e.TEXTURE1),e.bindTexture(e.TEXTURE_2D,d),e.uniform1i(a,0),e.uniform1i(n,1),e.uniform1f(c,g),o(u,p),L(e),e.bindTexture(e.TEXTURE_2D,E),e.bindFramebuffer(e.FRAMEBUFFER,v),e.useProgram(R),b}}const re=`
  #version 300 es
  
  precision mediump float;
  
  uniform sampler2D uSampler;
  
  in highp vec2 texCoord;
  
  out vec4 fragColor;
  
  vec3 rgb_to_hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
    vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);
  
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }
  
  void main() {
    vec4 c = texture(uSampler, texCoord);
    fragColor = vec4(rgb_to_hsv(c.rgb).rgb, 1.0);
  }
`.trim();function oe(t){const{gl:e,mapVertices:o}=t,r=A(e,C,re),a=e.getUniformLocation(r,"uSampler"),n=e.getAttribLocation(r,"aVertexPosition"),c=e.getAttribLocation(r,"aTextureCoord");return u=>{const p=e.getParameter(e.TEXTURE_BINDING_2D),f=e.getParameter(e.FRAMEBUFFER_BINDING),h=e.getParameter(e.CURRENT_PROGRAM);e.useProgram(r);const d=y(e,u.width,u.height),g=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,g),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,d,0),e.viewport(0,0,u.width,u.height),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,u.texture),e.uniform1i(a,0),o(n,c),L(e),e.bindTexture(e.TEXTURE_2D,p),e.bindFramebuffer(e.FRAMEBUFFER,f),e.useProgram(h),d}}const ae=256,ie=4,ne=4;function ce(t){const e=oe(t),o=$(t.gl,ae,ie,ne),r=te(t);return(a,n)=>{const c=e(a),u=o({texture:c,width:a.width,height:a.height});return{texture:r({input:{texture:c,width:a.width,height:a.height},lutTexture:u,intensity:n.filters.enhance/100}),width:a.width,height:a.height}}}const se=`
  #version 300 es
  
  precision lowp float;
  
  const mediump vec3 hsLuminanceWeighting = vec3(0.3, 0.3, 0.3);
  const mediump vec3 satLuminanceWeighting = vec3(0.2126, 0.7152, 0.0722);
  const lowp float permTexUnit = 1.0 / 256.0;
  const lowp float permTexUnitHalf = 0.5 / 256.0;
  const lowp float grainsize = 2.3;
  
  uniform sampler2D sTexture;
  
  uniform highp float width;
  uniform highp float height;
  
  uniform sampler2D curvesImage;
  uniform lowp float skipTone;
  
  uniform lowp float exposure;
  uniform lowp float contrast;
  uniform lowp float saturation;
  uniform lowp float warmth;
  uniform lowp float fadeAmount;
  uniform lowp float highlights;
  uniform lowp float shadows;
  uniform lowp float vignette;
  uniform lowp float grain;
  
  const lowp float shadowsTintIntensity = 0.0;
  const lowp vec3 shadowsTintColor = vec3(0.0, 0.0, 0.0);
  const lowp float highlightsTintIntensity = 0.0;
  const lowp vec3 highlightsTintColor = vec3(0.0, 0.0, 0.0);
  
  in highp vec2 texCoord;
  
  out lowp vec4 fragColor;
  
  highp float getLuma(highp vec3 rgbP) {
    return (0.299 * rgbP.r) + (0.587 * rgbP.g) + (0.114 * rgbP.b);
  }
  
  lowp vec3 rgbToHsv(lowp vec3 c) {
    highp vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    highp vec4 p = c.g < c.b ? vec4(c.bg, K.wz) : vec4(c.gb, K.xy);
    highp vec4 q = c.r < p.x ? vec4(p.xyw, c.r) : vec4(c.r, p.yzx);
    highp float d = q.x - min(q.w, q.y);
    highp float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }
  
  lowp vec3 hsvToRgb(lowp vec3 c) {
    highp vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    highp vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  
  highp vec3 rgbToHsl(highp vec3 color) {
    highp vec3 hsl;
    highp float fmin = min(min(color.r, color.g), color.b);
    highp float fmax = max(max(color.r, color.g), color.b);
    highp float delta = fmax - fmin;
    hsl.z = (fmax + fmin) / 2.0;
    if (delta == 0.0) {
      hsl.x = 0.0;
      hsl.y = 0.0;
    } else {
      if (hsl.z < 0.5) {
          hsl.y = delta / (fmax + fmin);
      } else {
          hsl.y = delta / (2.0 - fmax - fmin);
      }
      highp float deltaR = (((fmax - color.r) / 6.0) + (delta / 2.0)) / delta;
      highp float deltaG = (((fmax - color.g) / 6.0) + (delta / 2.0)) / delta;
      highp float deltaB = (((fmax - color.b) / 6.0) + (delta / 2.0)) / delta;
      if (color.r == fmax) {
          hsl.x = deltaB - deltaG;
      } else if (color.g == fmax) {
          hsl.x = (1.0 / 3.0) + deltaR - deltaB;
      } else if (color.b == fmax) {
          hsl.x = (2.0 / 3.0) + deltaG - deltaR;
      }
      if (hsl.x < 0.0) {
          hsl.x += 1.0;
      } else if (hsl.x > 1.0) {
          hsl.x -= 1.0;
      }
    }
    return hsl;
  }
  
  highp float hueToRgb(highp float f1, highp float f2, highp float hue) {
    if (hue < 0.0) {
      hue += 1.0;
    } else if (hue > 1.0) {
      hue -= 1.0;
    }
    
    highp float res;
    
    if ((6.0 * hue) < 1.0) {
      res = f1 + (f2 - f1) * 6.0 * hue;
    } else if ((2.0 * hue) < 1.0) {
      res = f2;
    } else if ((3.0 * hue) < 2.0) {
      res = f1 + (f2 - f1) * ((2.0 / 3.0) - hue) * 6.0;
    } else {
      res = f1;
    }
    
    return res;
  }
  
  highp vec3 hslToRgb(highp vec3 hsl) {
    if (hsl.y == 0.0) {
      return vec3(hsl.z);
    } else {
      highp float f2;
      if (hsl.z < 0.5) {
        f2 = hsl.z * (1.0 + hsl.y);
      } else {
        f2 = (hsl.z + hsl.y) - (hsl.y * hsl.z);
      }
      highp float f1 = 2.0 * hsl.z - f2;
      return vec3(hueToRgb(f1, f2, hsl.x + (1.0 / 3.0)), hueToRgb(f1, f2, hsl.x), hueToRgb(f1, f2, hsl.x - (1.0 / 3.0)));
    }
  }
  
  highp vec3 rgbToYuv(highp vec3 inP) {
    highp float luma = getLuma(inP);
    return vec3(luma, (1.0 / 1.772) * (inP.b - luma), (1.0 / 1.402) * (inP.r - luma));
  }
  
  lowp vec3 yuvToRgb(highp vec3 inP) {
    return vec3(1.402 * inP.b + inP.r, (inP.r - (0.299 * 1.402 / 0.587) * inP.b - (0.114 * 1.772 / 0.587) * inP.g), 1.772 * inP.g + inP.r);
  }
  
  lowp float easeInOutSigmoid(lowp float value, lowp float strength) {
    if (value > 0.5) {
      return 1.0 - pow(2.0 - 2.0 * value, 1.0 / (1.0 - strength)) * 0.5;
    } else {
      return pow(2.0 * value, 1.0 / (1.0 - strength)) * 0.5;
    }
  }
  
  lowp vec3 applyLuminanceCurve(lowp vec3 pixel) {
    highp float index = floor(clamp(pixel.z / (1.0 / 200.0), 0.0, 199.0));
    pixel.y = mix(0.0, pixel.y, smoothstep(0.0, 0.1, pixel.z) * (1.0 - smoothstep(0.8, 1.0, pixel.z)));
    pixel.z = texture(curvesImage, vec2(1.0 / 200.0 * index, 0)).a;
    return pixel;
  }
  
  lowp vec3 applyRGBCurve(lowp vec3 pixel) {
    highp float index = floor(clamp(pixel.r / (1.0 / 200.0), 0.0, 199.0));
    pixel.r = texture(curvesImage, vec2(1.0 / 200.0 * index, 0)).r;
    index = floor(clamp(pixel.g / (1.0 / 200.0), 0.0, 199.0));
    pixel.g = clamp(texture(curvesImage, vec2(1.0 / 200.0 * index, 0)).g, 0.0, 1.0);
    index = floor(clamp(pixel.b / (1.0 / 200.0), 0.0, 199.0));
    pixel.b = clamp(texture(curvesImage, vec2(1.0 / 200.0 * index, 0)).b, 0.0, 1.0);
    return pixel;
  }
  
  highp vec3 fadeAdjust(highp vec3 color, highp float fadeVal) {
    return (color * (1.0 - fadeVal)) + ((color + (vec3(-0.9772) * pow(vec3(color), vec3(3.0)) + vec3(1.708) * pow(vec3(color), vec3(2.0)) + vec3(-0.1603) * vec3(color) + vec3(0.2878) - color * vec3(0.9))) * fadeVal);
  }
  
  lowp vec3 tintRaiseShadowsCurve(lowp vec3 color) {
    return vec3(-0.003671) * pow(color, vec3(3.0)) + vec3(0.3842) * pow(color, vec3(2.0)) + vec3(0.3764) * color + vec3(0.2515);
  }
  
  lowp vec3 tintShadows(lowp vec3 texel, lowp vec3 tintColor, lowp float tintAmount) {
    return clamp(mix(texel, mix(texel, tintRaiseShadowsCurve(texel), tintColor), tintAmount), 0.0, 1.0);
  }
  
  lowp vec3 tintHighlights(lowp vec3 texel, lowp vec3 tintColor, lowp float tintAmount) {
    return clamp(mix(texel, mix(texel, vec3(1.0) - tintRaiseShadowsCurve(vec3(1.0) - texel), (vec3(1.0) - tintColor)), tintAmount), 0.0, 1.0);
  }
  
  highp vec4 rnm(in highp vec2 tc) {
    highp float noise = sin(dot(tc, vec2(12.9898, 78.233))) * 43758.5453;
    return vec4(fract(noise), fract(noise * 1.2154), fract(noise * 1.3453), fract(noise * 1.3647)) * 2.0 - 1.0;
  }
  
  highp float fade(in highp float t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }
  
  highp float pnoise3D(in highp vec3 p) {
    highp vec3 pi = permTexUnit * floor(p) + permTexUnitHalf;
    highp vec3 pf = fract(p);
    highp float perm = rnm(pi.xy).a;
    
    highp float n000 = dot(rnm(vec2(perm, pi.z)).rgb * 4.0 - 1.0, pf);
    highp float n001 = dot(rnm(vec2(perm, pi.z + permTexUnit)).rgb * 4.0 - 1.0, pf - vec3(0.0, 0.0, 1.0));
    
    perm = rnm(pi.xy + vec2(0.0, permTexUnit)).a;
    
    highp float n010 = dot(rnm(vec2(perm, pi.z)).rgb * 4.0 - 1.0, pf - vec3(0.0, 1.0, 0.0));
    highp float n011 = dot(rnm(vec2(perm, pi.z + permTexUnit)).rgb * 4.0 - 1.0, pf - vec3(0.0, 1.0, 1.0));
    
    perm = rnm(pi.xy + vec2(permTexUnit, 0.0)).a;
    
    highp float n100 = dot(rnm(vec2(perm, pi.z)).rgb * 4.0 - 1.0, pf - vec3(1.0, 0.0, 0.0));
    highp float n101 = dot(rnm(vec2(perm, pi.z + permTexUnit)).rgb * 4.0 - 1.0, pf - vec3(1.0, 0.0, 1.0));
    
    perm = rnm(pi.xy + vec2(permTexUnit, permTexUnit)).a;
    
    highp float n110 = dot(rnm(vec2(perm, pi.z)).rgb * 4.0 - 1.0, pf - vec3(1.0, 1.0, 0.0));
    highp float n111 = dot(rnm(vec2(perm, pi.z + permTexUnit)).rgb * 4.0 - 1.0, pf - vec3(1.0, 1.0, 1.0));
    
    highp vec4 n_x = mix(vec4(n000, n001, n010, n011), vec4(n100, n101, n110, n111), fade(pf.x));
    highp vec2 n_xy = mix(n_x.xy, n_x.zw, fade(pf.y));
    
    return mix(n_xy.x, n_xy.y, fade(pf.z));
  }
  
  lowp vec2 coordRot(in lowp vec2 tc, in lowp float angle) {
    return vec2(((tc.x * 2.0 - 1.0) * cos(angle) - (tc.y * 2.0 - 1.0) * sin(angle)) * 0.5 + 0.5, ((tc.y * 2.0 - 1.0) * cos(angle) + (tc.x * 2.0 - 1.0) * sin(angle)) * 0.5 + 0.5);
  }
  
  void main() {
    lowp vec4 source = texture(sTexture, texCoord);
    lowp vec4 result = source;
  
    const lowp float toolEpsilon = 0.005;
    if (skipTone < toolEpsilon) {
      result = vec4(applyRGBCurve(hslToRgb(applyLuminanceCurve(rgbToHsl(result.rgb)))), result.a);
    }
  
    mediump float hsLuminance = dot(result.rgb, hsLuminanceWeighting);

    mediump float shadow = clamp((pow(hsLuminance, 1.0 / shadows) + (-0.76) * pow(hsLuminance, 2.0 / shadows)) - hsLuminance, 0.0, 1.0);

    mediump float highlight = clamp((1.0 - (pow(1.0 - hsLuminance, 1.0 / (2.0 - highlights)) + (-0.8) * pow(1.0 - hsLuminance, 2.0 / (2.0 - highlights)))) - hsLuminance, -1.0, 0.0);

    lowp vec3 hsresult = vec3(0.0, 0.0, 0.0) + ((hsLuminance + shadow + highlight) - 0.0) * ((result.rgb - vec3(0.0, 0.0, 0.0)) / (hsLuminance - 0.0));

    mediump float contrastedLuminance = ((hsLuminance - 0.5) * 1.5) + 0.5;
    mediump float whiteInterp = contrastedLuminance * contrastedLuminance * contrastedLuminance;
    mediump float whiteTarget = clamp(highlights, 1.0, 2.0) - 1.0;
    hsresult = mix(hsresult, vec3(1.0), whiteInterp * whiteTarget);
    mediump float invContrastedLuminance = 1.0 - contrastedLuminance;
    mediump float blackInterp = invContrastedLuminance * invContrastedLuminance * invContrastedLuminance;
    mediump float blackTarget = 1.0 - clamp(shadows, 0.0, 1.0);

    hsresult = mix(hsresult, vec3(0.0), blackInterp * blackTarget);

    result = vec4(hsresult.rgb, result.a);
    result = vec4(clamp(((result.rgb - vec3(0.5)) * contrast + vec3(0.5)), 0.0, 1.0), result.a);

    if (abs(fadeAmount) > toolEpsilon) {
        result.rgb = fadeAdjust(result.rgb, fadeAmount);
    }

    lowp float satLuminance = dot(result.rgb, satLuminanceWeighting);
    lowp vec3 greyScaleColor = vec3(satLuminance);
    result = vec4(clamp(mix(greyScaleColor, result.rgb, saturation), 0.0, 1.0), result.a);

    if (abs(shadowsTintIntensity) > toolEpsilon) {
      result.rgb = tintShadows(result.rgb, shadowsTintColor, shadowsTintIntensity * 2.0);
    }

    if (abs(highlightsTintIntensity) > toolEpsilon) {
      result.rgb = tintHighlights(result.rgb, highlightsTintColor, highlightsTintIntensity * 2.0);
    }

    if (abs(exposure) > toolEpsilon) {
      mediump float mag = exposure * 1.045;
      mediump float exppower = 1.0 + abs(mag);
      if (mag < 0.0) {
          exppower = 1.0 / exppower;
      }
      result.r = 1.0 - pow((1.0 - result.r), exppower);
      result.g = 1.0 - pow((1.0 - result.g), exppower);
      result.b = 1.0 - pow((1.0 - result.b), exppower);
    }

    if (abs(warmth) > toolEpsilon) {
      highp vec3 yuvVec;
      if (warmth > 0.0) {
          yuvVec = vec3(0.1765, -0.1255, 0.0902);
      } else {
          yuvVec = -vec3(0.0588, 0.1569, -0.1255);
      }
      highp vec3 yuvColor = rgbToYuv(result.rgb);
      highp float luma = yuvColor.r;
      highp float curveScale = sin(luma * 3.14159);
      yuvColor += 0.375 * warmth * curveScale * yuvVec;
      result.rgb = yuvToRgb(yuvColor);
    }

    if (abs(grain) > toolEpsilon) {
      highp vec3 rotOffset = vec3(1.425, 3.892, 5.835);
      highp vec2 rotCoordsR = coordRot(texCoord, rotOffset.x);
      highp vec3 noise = vec3(pnoise3D(vec3(rotCoordsR * vec2(width / grainsize, height / grainsize), 0.0)));
      lowp vec3 lumcoeff = vec3(0.299, 0.587, 0.114);
      lowp float luminance = dot(result.rgb, lumcoeff);
      lowp float lum = smoothstep(0.2, 0.0, luminance);
      lum += luminance;
      noise = mix(noise, vec3(0.0), pow(lum, 4.0));
      result.rgb = result.rgb + noise * grain;
    }

    if (abs(vignette) > toolEpsilon) {
      const lowp float midpoint = 0.7;
      const lowp float fuzziness = 0.62;
      lowp float radDist = length(texCoord - 0.5) / sqrt(0.5);
      lowp float mag = easeInOutSigmoid(radDist * midpoint, fuzziness) * vignette * 0.645;
      result.rgb = mix(pow(result.rgb, vec3(1.0 / (1.0 - mag))), vec3(0.0), mag * mag);
    }

    fragColor = result;
  }
`.trim(),G=["width","height","exposure","contrast","saturation","warmth","fadeAmount","highlights","shadows","vignette","grain"],he=t=>{const{gl:e,mapVertices:o}=t,r=A(e,C,se),a=e.getAttribLocation(r,"aVertexPosition"),n=e.getAttribLocation(r,"aTextureCoord"),c=e.getUniformLocation(r,"sTexture"),u=e.getUniformLocation(r,"skipTone"),p=G.map(f=>e.getUniformLocation(r,f));return({input:f,params:h})=>{const d=e.getParameter(e.TEXTURE_BINDING_2D),g=e.getParameter(e.FRAMEBUFFER_BINDING),E=e.getParameter(e.CURRENT_PROGRAM);e.useProgram(r);const v=y(e,f.width,f.height),R=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,R),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,v,0),e.viewport(0,0,f.width,f.height),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,f.texture),e.uniform1i(c,0),G.forEach((b,T)=>{e.uniform1f(p[T],h[b])}),e.uniform1f(u,1),o(a,n),L(e),e.bindTexture(e.TEXTURE_2D,d),e.bindFramebuffer(e.FRAMEBUFFER,g),e.useProgram(E),v}};function ue(t){const e=he(t);return(o,{filters:r})=>({texture:e({input:o,params:{width:o.width,height:o.height,exposure:r.brightness/100,contrast:r.contrast/100*.3+1,saturation:(()=>{let n=r.saturation/100;return n>0&&(n*=1.05),n+1})(),warmth:r.warmth/100,fadeAmount:r.fade/100,highlights:(r.highlights*.75+100)/100,shadows:(r.shadows*.55+100)/100,vignette:r.vignette/100,grain:r.grain/100*.04}}),width:o.width,height:o.height})}const le=`
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
`.trim(),fe=`
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
`.trim(),me=t=>{const{gl:e,mapVertices:o}=t,r=A(e,le,fe),a=e.getAttribLocation(r,"position"),n=e.getAttribLocation(r,"inputTexCoord"),c=e.getUniformLocation(r,"sTexture"),u=e.getUniformLocation(r,"inputWidth"),p=e.getUniformLocation(r,"inputHeight"),f=e.getUniformLocation(r,"sharpen");return({input:h,sharpen:d})=>{const g=e.getParameter(e.TEXTURE_BINDING_2D),E=e.getParameter(e.FRAMEBUFFER_BINDING),v=e.getParameter(e.CURRENT_PROGRAM);e.useProgram(r);const R=y(e,h.width,h.height),b=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,b),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,R,0),e.viewport(0,0,h.width,h.height),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,h.texture),e.uniform1i(c,0),e.uniform1f(u,h.width),e.uniform1f(p,h.height),e.uniform1f(f,d),o(a,n),e.drawArrays(e.TRIANGLE_STRIP,0,4),e.bindTexture(e.TEXTURE_2D,g),e.bindFramebuffer(e.FRAMEBUFFER,E),e.useProgram(v),R}};function pe(t){const e=me(t);return(o,r)=>({texture:e({input:o,sharpen:.11+r.filters.sharpen/100*.6}),width:o.width,height:o.height})}const U=new OffscreenCanvas(1,1),i=U.getContext("webgl2"),B=Z(i),D={gl:i,mapVertices:(t,e,o="direct")=>{i.bindBuffer(i.ARRAY_BUFFER,o==="direct"?B.direct():B.invert()),i.enableVertexAttribArray(t),i.vertexAttribPointer(t,2,i.FLOAT,!1,8,0),i.bindBuffer(i.ARRAY_BUFFER,B.tex()),i.enableVertexAttribArray(e),i.vertexAttribPointer(e,2,i.FLOAT,!1,8,0)}},xe=j(D,"direct");function ve(t){const e=i.getParameter(i.FRAMEBUFFER_BINDING),o=i.getParameter(i.TEXTURE_BINDING_2D),r=i.getParameter(i.CURRENT_PROGRAM);xe.use(),i.activeTexture(i.TEXTURE0),i.bindTexture(i.TEXTURE_2D,t.texture),i.bindFramebuffer(i.FRAMEBUFFER,null),i.viewport(0,0,U.width,U.height),U.width=t.width,U.height=t.height,L(i),i.bindFramebuffer(i.FRAMEBUFFER,e),i.bindTexture(i.TEXTURE_2D,o),i.useProgram(r)}const Te=ce(D),de=ue(D),ge=pe(D);function Ee(t,e){const o=k(i,t),r=Te(o,e),a=de(r,e),n=ge(a,e);return ve(n),createImageBitmap(U)}addEventListener("message",t=>{const e=t.data;switch(e.type){case"requestFrame":Ee(e.bitmap,e.values).then(o=>{postMessage({type:"frameReady",bitmap:o},[o])});break}});
//# sourceMappingURL=mediaEditorRenderer.worker-lERkvjiM.js.map
