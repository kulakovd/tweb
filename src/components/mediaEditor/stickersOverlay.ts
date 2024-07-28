import {attachClickEvent} from '../../helpers/dom/clickEvent'

const className = 'stickers-overlay'

import './stickersOverlay.scss'
import findUpAsChild from '../../helpers/dom/findUpAsChild'
import {MediaEditorRenderer} from '../../lib/mediaEditor/mediaEditorRenderer'
import {Point} from '../../lib/mediaEditor/geometry'
import {MediaEditorState} from '../../lib/mediaEditor/mediaEditorState'
import {MediaEditorTextState} from '../../lib/mediaEditor/mediaEditorValues'

export class StickersOverlay {
  public container: HTMLDivElement

  private newType: 'text' | 'sticker' = 'text'
  private selectedSticker: HTMLElement | null = null

  private enabled = false

  public setEnabled(enabled: boolean) {
    this.enabled = enabled
    if(enabled) {
      this.container.style.pointerEvents = 'auto'
    } else {
      this.container.style.pointerEvents = 'none'
      this.unselectSticker()
    }
  }

  private unselectSticker() {
    if(this.selectedSticker) {
      this.selectedSticker.classList.remove('selected')
      this.selectedSticker = null
      this.state.selectSticker(-1)
    }
  }

  constructor(private renderer: MediaEditorRenderer, private state: MediaEditorState) {
    this.container = document.createElement('div')
    this.container.classList.add(className)

    attachClickEvent(this.container, (e) => {
      if(!this.enabled) return

      const target = findUpAsChild(e.target as HTMLElement, this.container)
      if(!target && this.newType === 'text') {
        const point = this.renderer.pointMatcher.value.toImagePoint({x: e.clientX, y: e.clientY})

        const index = this.state.addNewTextSticker(point)
        const n = this.createTextSticker(point, index)

        this.selectSticker(n)
        this.applyTextState(n, this.state.textState)
        this.container.append(n)

        n.focus()

        return
      }

      if(target.dataset.type === 'text') {
        this.selectSticker(target)
      }
    })

    state.addEventListener('textState', () => {
      if(this.selectedSticker) {
        const textState = this.state.textState
        this.applyTextState(this.selectedSticker, textState)
        const index = parseInt(this.selectedSticker.dataset.index!)
        this.state.updateTextSticker(index, textState)
      }
    })

    state.addEventListener('restored', (values, fields) => {
      if(fields.includes('stickers')) {
        this.container.innerHTML = ''
        for(let i = 0; i < state.current.stickers.length; i++) {
          const sticker = state.current.stickers[i]
          if(sticker.type === 'text') {
            const n = this.createTextSticker(sticker.position, i)
            n.textContent = sticker.content
            this.applyTextState(n, sticker)
            this.container.append(n)
          }
        }
      }
    })
  }

  private selectSticker(sticker: HTMLElement) {
    if(this.selectedSticker) {
      this.selectedSticker.classList.remove('selected')
    }
    this.selectedSticker = sticker
    this.selectedSticker.classList.add('selected')

    const index = parseInt(sticker.dataset.index!)
    this.state.selectSticker(index)
  }

  private applyTextState(textSticker: HTMLElement, textState: MediaEditorTextState) {
    textSticker.style.fontSize = `${textState.fontSize}px`
    textSticker.style.fontFamily = textState.fontFamily
    textSticker.style.textAlign = textState.align
    if(textState.frame === 'none') {
      textSticker.style.color = textState.color
      textSticker.style.backgroundColor = 'transparent'
    } else if(textState.frame === 'black') {
      textSticker.style.color = 'white'
      textSticker.style.backgroundColor = textState.color
    } else if(textState.frame === 'white') {
      textSticker.style.color = textState.color
      textSticker.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
    }
  }

  private createTextSticker(point: Point, index: number) {
    const textSticker = document.createElement('div')
    const screenPoint = this.renderer.pointMatcher.value.toScreenPoint(point)

    textSticker.classList.add(`${className}-sticker`, `${className}-text-sticker`)
    textSticker.dataset.type = 'text'
    textSticker.dataset.index = index.toString()
    textSticker.style.left = `${screenPoint.x}px`
    textSticker.style.top = `${screenPoint.y}px`
    textSticker.contentEditable = 'true'

    textSticker.addEventListener('input', () => {
      this.state.updateTextSticker(index, {content: textSticker.textContent!})
    })

    return textSticker
  }
}
