import {
  defaultMediaEncoderValues,
  MediaEditorDrawState,
  MediaEditorPath,
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
}> {
  private _lastCommit: MediaEditorValues = structuredClone(defaultMediaEncoderValues)
  private _current: MediaEditorValues = structuredClone(defaultMediaEncoderValues)

  private undoStack: MediaEditorCommand[] = []
  private redoStack: MediaEditorCommand[] = []

  private _drawState: MediaEditorDrawState = {
    tool: 'pen',
    size: 15
  }

  get drawState() {
    return this._drawState
  }

  updateDrawState(update: Partial<MediaEditorDrawState>) {
    Object.assign(this._drawState, update)
    console.log('[MediaEditorState] drawState updated', this._drawState)
  }

  get current() {
    return this._current
  }

  private _lastDrawIndex = 0
  startPath(path: {
    tool: MediaEditorPath['tool']
    color?: MediaEditorPath['color']
    size: MediaEditorPath['size']
    point: Point
  }) {
    const points = [{x: path.point.x, y: path.point.y}]
    this._lastDrawIndex = this._current.draw.length
    const newPath: MediaEditorPath = {
      type: 'path',
      tool: path.tool,
      color: path.color,
      size: path.size,
      completed: false,
      points
    }
    this.update({
      draw: [...this._current.draw, newPath]
    })
  }

  updatePath(point: Point) {
    const draw = this._current.draw
    const lastPath = draw[this._lastDrawIndex]
    if(lastPath) {
      const lastPoint = lastPath.points[lastPath.points.length - 1]
      if(lastPoint.x === point.x && lastPoint.y === point.y) {
        return
      }
      lastPath.points.push({x: point.x, y: point.y})
      this.update({draw})
    }
  }

  commitDraw() {
    const draw = this._current.draw
    const lastPath = draw[this._lastDrawIndex]
    if(lastPath) {
      lastPath.completed = true
      this.commit({draw})
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
