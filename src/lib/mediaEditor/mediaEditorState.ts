import {
  defaultMediaEncoderValues,
  MediaEditorDrawState,
  MediaEditorPath, MediaEditorText, MediaEditorTextState,
  MediaEditorValues
} from './mediaEditorValues'
import EventListenerBase from '../../helpers/eventListenerBase'
import {Point} from './geometry'

interface MediaEditorCommand {
  execute(first: boolean): void
  undo(): void
}

export type MediaEditorStateUpdate = Omit<Partial<MediaEditorValues>, 'filters'> & {
  filters?: Partial<MediaEditorValues['filters']>
}

export class MediaEditorState extends EventListenerBase<{
  changed: (values: MediaEditorValues, fields: Array<keyof MediaEditorValues>, isRestored: boolean) => void
  restored: (values: MediaEditorValues, fields: Array<keyof MediaEditorValues>) => void
  textState: (textState: MediaEditorTextState) => void
}> {
  private _lastCommit: MediaEditorValues = structuredClone(defaultMediaEncoderValues)
  private _current: MediaEditorValues = structuredClone(defaultMediaEncoderValues)

  private undoStack: MediaEditorCommand[] = []
  private redoStack: MediaEditorCommand[] = []

  private _drawState: MediaEditorDrawState = {
    tool: 'pen',
    size: 15
  }

  get current() {
    return this._current
  }

  get drawState() {
    return this._drawState
  }

  updateDrawState(update: Partial<MediaEditorDrawState>) {
    Object.assign(this._drawState, update)
  }

  private _textState: MediaEditorTextState = {
    color: '#ffffff',
    fontSize: 24,
    fontFamily: 'Roboto',
    align: 'left',
    frame: 'none'
  }

  get textState() {
    return this._textState
  }

  updateTextState(update: Partial<MediaEditorTextState>, final: boolean = false) {
    Object.assign(this._textState, update)
    this.dispatchEvent('textState', this._textState)
    if(this._selectedStickerIndex >= 0) {
      this.updateTextSticker(this._selectedStickerIndex, update)
      if(final) {
        this.commitStickers()
      }
    }
  }

  private updateTextStateFromTextIndex(index: number) {
    const sticker = this._current.stickers[index]
    if(sticker && sticker.type === 'text') {
      const {color, fontSize, fontFamily, align, frame} = sticker
      this.updateTextState({color, fontSize, fontFamily, align, frame})
    }
  }

  private _lastStickerIndex = 0
  private _selectedStickerIndex = -1

  selectSticker(index: number) {
    this._selectedStickerIndex = index
    this.updateTextStateFromTextIndex(index)
  }

  addNewTextSticker(point: Point) {
    this._lastStickerIndex = this._current.stickers.length
    const textSticker: MediaEditorText = {
      ...this._textState,
      type: 'text',
      position: {x: point.x, y: point.y},
      content: '',
      rotation: 0
    }
    this.update({stickers: [...this._current.stickers, textSticker]})
    return this._lastStickerIndex
  }

  updateTextSticker(index: number, update: Partial<MediaEditorText>) {
    const stickers = this._current.stickers
    const sticker = stickers[index]
    if(sticker) {
      Object.assign(sticker, update)
      this.update({stickers})
    }
  }

  commitStickers(update?: Partial<MediaEditorValues['stickers']>) {
    // TODO
  }

  private _lastPaintingIndex = 0
  startPath(path: {
    tool: MediaEditorPath['tool']
    color?: MediaEditorPath['color']
    size: MediaEditorPath['size']
    point: Point
  }) {
    const points = [{x: path.point.x, y: path.point.y}]
    this._lastPaintingIndex = this._current.paintings.length
    const newPath: MediaEditorPath = {
      type: 'path',
      tool: path.tool,
      color: path.color,
      size: path.size,
      completed: false,
      points
    }
    this.update({
      paintings: [...this._current.paintings, newPath]
    })
  }

  updatePath(point: Point) {
    const paintings = this._current.paintings
    const lastPath = paintings[this._lastPaintingIndex]
    if(lastPath) {
      const lastPoint = lastPath.points[lastPath.points.length - 1]
      if(lastPoint.x === point.x && lastPoint.y === point.y) {
        return
      }
      lastPath.points.push({x: point.x, y: point.y})
      this.update({paintings})
    }
  }

  commitDraw() {
    const paintings = this._current.paintings
    const lastPath = paintings[this._lastPaintingIndex]
    if(lastPath) {
      lastPath.completed = true
      this.commit({paintings})
    }
  }

  commitFlip() {
    this.commit({flip: !this._lastCommit.flip})
  }

  rotateCounterClockwise() {
    this.update({transformRotation: (this._current.transformRotation + 270) % 360})
  }

  setDefaultCrop(crop: MediaEditorValues['crop']) {
    this._lastCommit.crop = crop
    this.update({crop})
  }

  private _updateFilter(name: keyof MediaEditorValues['filters'], value: number, isRestored: boolean) {
    if(this._current.filters[name] === value) {
      return
    }
    this._current.filters[name] = value
    this.dispatchEvent('changed', this._current, ['filters'], isRestored)
    if(isRestored) {
      this.dispatchEvent('restored', this._current, ['filters'])
    }
  }

  updateFilter(name: keyof MediaEditorValues['filters'], value: number) {
    this._updateFilter(name, value, false)
  }

  commitFilter(name: keyof MediaEditorValues['filters'], value: number) {
    const oldValue = this._lastCommit.filters[name]
    if(oldValue === value) {
      return
    }
    const command: MediaEditorCommand = {
      execute: (first) => {
        this._lastCommit.filters[name] = value
        this._updateFilter(name, value, !first)
      },
      undo: () => {
        this._lastCommit.filters[name] = oldValue
        this._updateFilter(name, oldValue, true)
      }
    }
    this._commitCommand(command)
  }

  update(update: MediaEditorStateUpdate, isRestored: boolean = false) {
    const fields = (Object.keys(update) as Array<keyof MediaEditorValues>).filter(key => this._current[key] !== update[key])
    const {filters, ...rest} = update
    Object.assign(this._current, rest)
    this.dispatchEvent('changed', this._current, fields, isRestored)
    if(isRestored) {
      this.dispatchEvent('restored', this._current, fields)
    }
  }

  commit(update: MediaEditorStateUpdate) {
    const lastCommit = this._lastCommit
    const revertUpdate: Partial<MediaEditorValues> = {}
    for(const key in update) {
      // @ts-ignore
      revertUpdate[key] = lastCommit[key]
    }

    const command: MediaEditorCommand = {
      execute: (first) => {
        Object.assign(this._lastCommit, update)
        this.update(update, !first)
      },
      undo: () => {
        Object.assign(this._lastCommit, revertUpdate)
        this.update(revertUpdate, true)
      }
    }

    this._commitCommand(command)
  }

  undo() {
    const command = this.undoStack.pop()
    if(command) {
      command.undo()
      this.redoStack.push(command)
    }
  }

  redo() {
    const command = this.redoStack.pop()
    if(command) {
      command.execute(false)
      this.undoStack.push(command)
    }
  }

  private get lastCommand() {
    return this.undoStack[this.undoStack.length - 1]
  }

  private _commitCommand(command: MediaEditorCommand) {
    this.undoStack.push(command)
    this.redoStack.length = 0
    command.execute(true)
  }
}
