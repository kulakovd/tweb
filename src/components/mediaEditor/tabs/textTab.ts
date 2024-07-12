import {buttonsSelector} from '../buttonsSelector'
import Button from '../../button'
import {rangeSlider} from '../rangeSlider'
import {colorSelector, defaultColors} from '../colorSelector'
import {_i18n} from '../../../lib/langPack'
import ripple from '../../ripple'

type FontDefinition = {
  fontFamily: string;
  name: string;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
}

const fonts: Array<FontDefinition> = [
  {fontFamily: 'Roboto', name: 'Roboto', weight: 600},
  {fontFamily: 'American Typewriter', name: 'Typewriter', weight: 600},
  {fontFamily: 'Avenir Next', name: 'Avenir Next', weight: 600},
  {fontFamily: 'Courier New', name: 'Courier New', weight: 600},
  {fontFamily: 'Noteworthy', name: 'Noteworthy', weight: 600},
  {fontFamily: 'Papyrus', name: 'Papyrus', weight: 400},
  {fontFamily: 'Snell Roundhand', name: 'Snell Roundhand', weight: 600}
]

const className = 'media-editor-text'
const btn = 'media-editor-selector-btn'

export function textTab(tab: HTMLElement) {
  const alignAndFrame = document.createElement('div')
  alignAndFrame.classList.add(`${className}-align-and-frame`)

  const alignSelector = document.createElement('div')
  alignSelector.classList.add(`${className}-align-selector`)
  alignSelector.append(
    Button(btn, {icon: 'align_left'}),
    Button(btn, {icon: 'align_center'}),
    Button(btn, {icon: 'align_right'})
  )

  const selectAlign = buttonsSelector(alignSelector)
  selectAlign(0)

  const frameSelector = document.createElement('div')
  frameSelector.classList.add(`${className}-frame-selector`)
  frameSelector.append(
    Button(btn, {icon: 'fontframe_no_frame'}),
    Button(btn, {icon: 'fontframe_black'}),
    Button(btn, {icon: 'fontframe_white'})
  )

  const selectFrame = buttonsSelector(frameSelector)
  selectFrame(0)

  alignAndFrame.append(alignSelector, frameSelector)

  const sizeRange = rangeSlider({
    min: 2,
    max: 48,
    value: 24,
    label: 'MediaEditor.Text.Size',
    onChange: () => {
    }
  })

  const colors = colorSelector((color) => {
    sizeRange.updateColor(color)
  })
  colors.selectColor(defaultColors[0])

  const fontSelector = document.createElement('div')
  fontSelector.classList.add('media-editor-font-selector')

  const fontSelectorLabel = document.createElement('div')
  fontSelectorLabel.classList.add('media-editor-selector-label')
  _i18n(fontSelectorLabel, 'MediaEditor.Text.Font')

  const fontSelectorBtns = document.createElement('div')
  fontSelectorBtns.classList.add('media-editor-font-selector')

  for(const font of fonts) {
    const fontEl = createFontEl(font)
    fontSelectorBtns.append(fontEl)
  }

  const selectFont = buttonsSelector(fontSelectorBtns)
  selectFont(0)

  fontSelector.append(fontSelectorLabel, fontSelectorBtns)

  tab.append(
    colors.container,
    alignAndFrame,
    sizeRange.container,
    fontSelector
  )
}

function createFontEl(font: FontDefinition) {
  const fontEl = document.createElement('button')
  ripple(fontEl)
  fontEl.classList.add('media-editor-font-btn', 'media-editor-selector-btn')
  fontEl.style.fontFamily = font.fontFamily
  if(font.weight) fontEl.style.fontWeight = '' + font.weight

  const span = document.createElement('span')
  span.textContent = font.name
  fontEl.append(span)

  return fontEl
}
