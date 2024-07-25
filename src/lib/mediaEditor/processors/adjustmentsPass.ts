import {Texture} from '../webgl/webgl'
import {MediaEditorValues} from '../mediaEditorValues'
import {createAdjustmentsProgram} from '../webgl/adjustmentsProgram'
import {MediaEditorRenderingContext} from '../webgl/context'

export function createAdjustmentsPass(ctx: MediaEditorRenderingContext): (input: Texture, values: MediaEditorValues) => Texture  {
  const adjustmentProgram = createAdjustmentsProgram(ctx)

  return (input: Texture, {filters}: MediaEditorValues) => {
    const output = adjustmentProgram({
      input,
      params: {
        width: input.width,
        height: input.height,
        exposure: filters.brightness / 100,
        contrast: filters.contrast / 100 * 0.3 + 1,
        saturation: (() => {
          let v = filters.saturation / 100
          if(v > 0) {
            v *= 1.05
          }
          return v + 1
        })(),
        warmth: filters.warmth / 100,
        fadeAmount: filters.fade / 100,
        highlights: (filters.highlights * 0.75 + 100) / 100,
        shadows: (filters.shadows * 0.55 + 100) / 100,
        vignette: filters.vignette / 100,
        grain: filters.grain / 100 * 0.04
      }
    })

    // return input
    return {
      texture: output,
      width: input.width,
      height: input.height
    }
  }
}
