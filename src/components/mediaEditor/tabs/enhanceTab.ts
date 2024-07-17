import {rangeSlider} from '../rangeSlider'
import {MediaEditor} from '../mediaEditor'
import {defaultMediaEncoderValues, MediaEncoderValues} from '../../../lib/mediaEditor/mediaEncoderValues'
import {LangPackKey} from '../../../lib/langPack'

const enhanceTools: Array<{
  label: LangPackKey,
  name: keyof MediaEncoderValues,
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
  enhanceTools.forEach(tool => {
    const range = rangeSlider({
      min: tool.scale === 'absolute' ? 0 : -100,
      max: 100,
      value: defaultMediaEncoderValues[tool.name],
      label: tool.label,
      highlight: true,
      color: 'var(--primary-color)',
      onChange: (value) => {
        mc.updateValues({[tool.name]: value})
      }
    });
    tab.append(range.container);
  })
}
