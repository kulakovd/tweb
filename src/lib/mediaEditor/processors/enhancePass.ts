import {MediaEditorValues} from '../mediaEditorValues'
import {createLUTGenerator} from '../webgl/enhanceGenerateLUT'
import {createEnhanceColorLookupProgram} from '../webgl/enhanceColorLookupProgram'
import {createColorConvertProgram} from '../webgl/colorConvertProgram'
import {Texture} from '../webgl/webgl'
import {MediaEditorRenderingContext} from '../webgl/context'

const histBinCount = 256
const gridWidth = 4
const gridHeight = 4

export function createEnhancePass(ctx: MediaEditorRenderingContext): (input: Texture, values: MediaEditorValues) => Texture {
  const colorConvertProgram = createColorConvertProgram(ctx)
  const generateLUT = createLUTGenerator(ctx.gl, histBinCount, gridWidth, gridHeight)
  const enhanceColorLookupProgram = createEnhanceColorLookupProgram(ctx)

  return (input: Texture, values: MediaEditorValues) => {
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
}
