import {MediaEditorRenderingContext} from '../webgl/context'
import {Texture} from '../webgl/webgl'
import {createSharpenProgram} from '../webgl/sharpenProgram'
import {MediaEditorValues} from '../mediaEditorValues'

export function createSharpenPass(ctx: MediaEditorRenderingContext): (input: Texture, values: MediaEditorValues) => Texture {
  const sharpenProgram = createSharpenProgram(ctx)

  return (input: Texture, values) => {
    const output = sharpenProgram({
      input,
      sharpen: 0.11 + values.sharpen / 100 * 0.6
    })

    return {
      texture: output,
      width: input.width,
      height: input.height
    }
  }
}
