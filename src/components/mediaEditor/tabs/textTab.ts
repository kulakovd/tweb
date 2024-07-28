import {buttonsSelector} from '../buttonsSelector'
import Button from '../../button'
import {rangeSlider} from '../rangeSlider'
import {colorSelector, defaultColors} from '../colorSelector'
import {_i18n} from '../../../lib/langPack'
import ripple from '../../ripple'
import {MediaEditor} from '../mediaEditor'
import debounce from '../../../helpers/schedulers/debounce'

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

const frames = [
  {
    icon: 'fontframe_no_frame',
    value: 'none'
  },
  {
    icon: 'fontframe_black',
    value: 'black'
  },
  {
    icon: 'fontframe_white',
    value: 'white'
  }
] as const

const aligns = [
  {
    icon: 'align_left',
    value: 'left'
  },
  {
    icon: 'align_center',
    value: 'center'
  },
  {
    icon: 'align_right',
    value: 'right'
  }
] as const

const className = 'media-editor-text'
const btn = 'media-editor-selector-btn'

export function textTab(tab: HTMLElement, me: MediaEditor) {
  let prevColor = '#000'

  const alignAndFrame = document.createElement('div')
  alignAndFrame.classList.add(`${className}-align-and-frame`)

  const alignSelector = document.createElement('div')
  alignSelector.classList.add(`${className}-align-selector`)
  for(const align of aligns) {
    alignSelector.append(Button(btn, {icon: align.icon}))
  }

  const selectAlign = buttonsSelector(alignSelector, (index) => {
    me.state.updateTextState({align: aligns[index].value}, true)
  })
  selectAlign(0)

  const frameSelector = document.createElement('div')
  frameSelector.classList.add(`${className}-frame-selector`)
  for(const frame of frames) {
    frameSelector.append(Button(btn, {icon: frame.icon}))
  }

  const selectFrame = buttonsSelector(frameSelector, (index) => {
    me.state.updateTextState({frame: frames[index].value}, true)
  })
  selectFrame(0)

  alignAndFrame.append(alignSelector, frameSelector)

  const sizeRange = rangeSlider({
    min: 2,
    max: 48,
    value: 24,
    label: 'MediaEditor.Text.Size',
    onChange: (value, final) => {
      me.state.updateTextState({fontSize: value}, final)
    }
  })

  const selectFinalColor = debounce((color: string) => {
    me.state.updateTextState({color}, true)
  }, 200)

  const colors = colorSelector((color) => {
    if(color !== prevColor) {
      prevColor = color
      sizeRange.updateColor(color)
      me.state.updateTextState({color})
      selectFinalColor(color)
    }
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

  const selectFont = buttonsSelector(fontSelectorBtns, (index) => {
    me.state.updateTextState({fontFamily: fonts[index].fontFamily}, true)
  })
  selectFont(0)

  fontSelector.append(fontSelectorLabel, fontSelectorBtns)

  me.state.addEventListener('textState', (textState) => {
    const {fontSize, fontFamily, color, align, frame} = textState
    sizeRange.setValue(fontSize)
    colors.selectColor(color)
    selectAlign(aligns.findIndex((a) => a.value === align), true)
    selectFrame(frames.findIndex((f) => f.value === frame), true)
    selectFont(fonts.findIndex((f) => f.fontFamily === fontFamily), true)
  })

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
