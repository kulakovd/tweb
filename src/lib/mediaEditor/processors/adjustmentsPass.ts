import {Texture} from '../webgl/webgl'
import {MediaEditorValues} from '../mediaEditorValues'
import {createAdjustmentsProgram} from '../webgl/adjustmentsProgram'
import {MediaEditorRenderingContext} from '../webgl/context'

export function createAdjustmentsPass(ctx: MediaEditorRenderingContext): (input: Texture, values: MediaEditorValues) => Texture  {
  const adjustmentProgram = createAdjustmentsProgram(ctx)

  return (input: Texture, values: MediaEditorValues) => {
    const output = adjustmentProgram({
      input,
      params: {
        width: input.width,
        height: input.height,
        exposure: values.brightness / 100,
        contrast: values.contrast / 100 * 0.3 + 1,
        saturation: (() => {
          let v = values.saturation / 100
          if(v > 0) {
            v *= 1.05
          }
          return v + 1
        })(),
        warmth: values.warmth / 100,
        fadeAmount: values.fade / 100,
        highlights: (values.highlights * 0.75 + 100) / 100,
        shadows: (values.shadows * 0.55 + 100) / 100,
        vignette: values.vignette / 100,
        grain: values.grain / 100 * 0.04
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
