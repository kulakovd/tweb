import {rangeSlider} from '../rangeSlider'

const enhanceTools = [
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
] as const

export function enhanceTab(tab: HTMLDivElement) {
  enhanceTools.forEach(tool => {
    const range = rangeSlider({
      min: tool.scale === 'absolute' ? 0 : -50,
      max: tool.scale === 'absolute' ? 100 : 50,
      value: 0,
      label: tool.label,
      highlight: true,
      color: 'var(--primary-color)',
      onChange: () => {}
    });
    tab.append(range.container);
  })
}
