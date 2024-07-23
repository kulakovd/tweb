import {rangeSlider} from '../rangeSlider'
import {MediaEditor} from '../mediaEditor'
import {defaultMediaEncoderValues, MediaEditorValues} from '../../../lib/mediaEditor/mediaEditorValues'
import {LangPackKey} from '../../../lib/langPack'

const enhanceTools: Array<{
  label: LangPackKey,
  name: keyof MediaEditorValues,
  scale: 'absolute' | 'symmetrical'
}> = [
  {
    label: 'MediaEditor.Enhance.Enhance',
    name: 'enhance',
    scale: 'absolute'
  },
  {
    label: 'MediaEditor.Enhance.Brightness',
    name: 'brightness',
    scale: 'symmetrical'
  },
  {
    label: 'MediaEditor.Enhance.Contrast',
    name: 'contrast',
    scale: 'symmetrical'
  },
  {
    label: 'MediaEditor.Enhance.Saturation',
    name: 'saturation',
    scale: 'symmetrical'
  },
  {
    label: 'MediaEditor.Enhance.Warmth',
    name: 'warmth',
    scale: 'symmetrical'
  },
  {
    label: 'MediaEditor.Enhance.Fade',
    name: 'fade',
    scale: 'absolute'
  },
  {
    label: 'MediaEditor.Enhance.Highlights',
    name: 'highlights',
    scale: 'symmetrical'
  },
  {
    label: 'MediaEditor.Enhance.Shadows',
    name: 'shadows',
    scale: 'symmetrical'
  },
  {
    label: 'MediaEditor.Enhance.Vignette',
    name: 'vignette',
    scale: 'absolute'
  },
  {
    label: 'MediaEditor.Enhance.Grain',
    name: 'grain',
    scale: 'absolute'
  },
  {
    label: 'MediaEditor.Enhance.Sharpen',
    name: 'sharpen',
    scale: 'absolute'
  }
]

export function enhanceTab(tab: HTMLDivElement, mc: MediaEditor) {
  const kek: Partial<Record<keyof MediaEditorValues, (value: number) => void>> = {}
  mc.state.addEventListener('changed', (values, fields) => {
    fields.forEach(field => {
      kek[field]?.(values[field] as number)
    })
  })

  enhanceTools.forEach(tool => {
    const range = rangeSlider({
      min: tool.scale === 'absolute' ? 0 : -100,
      max: 100,
      value: defaultMediaEncoderValues[tool.name] as number,
      label: tool.label,
      highlight: true,
      color: 'var(--primary-color)',
      onChange: (value, final) => {
        const newState = {[tool.name]: value}
        if(final) {
          mc.state.commit(newState)
        } else {
          mc.state.update(newState)
        }
      }
    });
    kek[tool.name] = range.setValue;
    tab.append(range.container);
  })
}
