import {MediaEncoderValues} from '../mediaEncoderValues'
import {createLUTGenerator} from '../webgl/enhanceGenerateLUT'
import {createEnhanceColorLookupProgram} from '../webgl/enhanceColorLookupProgram'
import {createVertexBuffer} from '../webgl/vertex'
import {createColorConvertProgram} from '../webgl/colorConvertProgram'
import {Texture} from '../webgl/webgl'

const histBinCount = 256
const gridWidth = 4
const gridHeight = 4

export function enhancePass(gl: WebGL2RenderingContext, input: Texture, values: MediaEncoderValues): Texture {
  const vertexBuffer = createVertexBuffer(gl)

  const colorConvertProgram = createColorConvertProgram(gl, vertexBuffer)
  const generateLUT = createLUTGenerator(gl, histBinCount, gridWidth, gridHeight)
  const enhanceColorLookupProgram = createEnhanceColorLookupProgram(gl, vertexBuffer)

  const hsvTexture: WebGLTexture = colorConvertProgram(input)

  const lookupTexture: WebGLTexture = generateLUT({
    texture: hsvTexture,
    width: input.width,
    height: input.height
  })

  const outputTexture = enhanceColorLookupProgram({
    input: {
      texture: hsvTexture,
      width: input.width,
      height: input.height
    },
    lutTexture: lookupTexture,
    intensity: values.enhance / 100
  })

  return {
    texture: outputTexture,
    width: input.width,
    height: input.height
  }
}
