export function createLUTGenerator(gl, binCount, gridWidth, gridHeight) {
  const totalSegments = gridWidth * gridHeight
  const defaultClipLimit = 1.25

  // this program does not use shaders (computation is done in JS)
  return (input) => {
    const prevTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
    const prevFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

    const framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, input.texture, 0)
    gl.viewport(0, 0, input.width, input.height)

    const inputBuffer = new Uint8Array(input.width * input.height * 4);
    gl.readPixels(0, 0, input.width, input.height, gl.RGBA, gl.UNSIGNED_BYTE, inputBuffer);

    const tileWidth = Math.floor(input.width / gridWidth)
    const tileHeight = Math.floor(input.height / gridHeight)
    const tileArea = tileWidth * tileHeight
    const clipLimit = Math.floor(Math.max(1, defaultClipLimit * tileArea / binCount))
    const scale = 255 / tileArea

    const bytesPerRow = input.width * 4

    const hist = Array.from({length: totalSegments}, () => new Uint32Array(binCount))
    const cdfs = Array.from({length: totalSegments})
    const cdfsMin = Array.from({length: totalSegments}, () => 0)
    const cdfsMax = Array.from({length: totalSegments}, () => 0)

    const xMul = gridWidth / input.width;
    const yMul = gridHeight / input.height;

    // Generate histogram for each tile
    for(let y = 0; y < input.height; y++) {
      const yOffset = y * bytesPerRow;
      for(let x = 0; x < input.width; x++) {
        const index = x * 4 + yOffset;

        const tx = Math.floor(x * xMul);
        const ty = Math.floor(y * yMul);
        const t = ty * gridWidth + tx;

        const value = inputBuffer[index + 2];
        hist[t][value]++;
      }
    }

    // Clip and redistribute
    for(let i = 0; i < totalSegments; i++) {
      if(clipLimit > 0) {
        let clipped = 0;
        for(let j = 0; j < binCount; ++j) {
          if(hist[i][j] > clipLimit) {
            clipped += Math.floor(hist[i][j] - clipLimit);
            hist[i][j] = clipLimit;
          }
        }

        const redistBatch = Math.floor(clipped / binCount);
        const residual = clipped - redistBatch * binCount;

        for(let j = 0; j < binCount; ++j) {
          hist[i][j] += redistBatch;
        }

        for(let j = 0; j < residual; ++j) {
          hist[i][j]++;
        }
      }

      cdfs[i] = hist[i].slice(0)

      let hMin = binCount - 1;
      for(let j = 0; j < hMin; ++j) {
        if(cdfs[i][j] !== 0) {
          hMin = j;
        }
      }

      let cdf = 0;
      for(let j = hMin; j < binCount; ++j) {
        cdf += cdfs[i][j];
        cdfs[i][j] = Math.floor(Math.min(255, cdf * scale));
      }

      cdfsMin[i] = cdfs[i][hMin];
      cdfsMax[i] = cdfs[i][binCount - 1];
    }

    const resultSize = 4 * binCount * totalSegments;
    const resultBytesPerRow = 4 * binCount;

    const result = new Uint8Array(resultSize);
    for(let tile = 0; tile < totalSegments; tile++) {
      const yOffset = tile * resultBytesPerRow;
      for(let i = 0; i < binCount; i++) {
        const index = i * 4 + yOffset;
        result[index] = cdfs[tile][i];
        result[index + 1] = cdfsMin[tile];
        result[index + 2] = cdfsMax[tile];
      }
    }

    const resultTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, resultTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, binCount, totalSegments, 0, gl.RGBA, gl.UNSIGNED_BYTE, result)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    gl.bindFramebuffer(gl.FRAMEBUFFER, prevFramebuffer)
    gl.bindTexture(gl.TEXTURE_2D, prevTexture)

    return resultTexture
  }
}
