import {defaultMediaEncoderValues, MediaEditorValues} from './mediaEditorValues'
import EventListenerBase from '../../helpers/eventListenerBase'

interface MediaEditorCommand {
  execute(): void
  undo(): void
}

export class MediaEditorState extends EventListenerBase<{
  changed: (values: MediaEditorValues, fields: Array<keyof MediaEditorValues>, isRestored: boolean) => void
}> {
  private _lastCommit: MediaEditorValues = structuredClone(defaultMediaEncoderValues)
  private _current: MediaEditorValues = structuredClone(defaultMediaEncoderValues)
  private undoStack: MediaEditorCommand[] = []
  private redoStack: MediaEditorCommand[] = []

  get current() {
    return this._current
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

  update(update: Partial<MediaEditorValues>, isRestored: boolean = false) {
    const fields = (Object.keys(update) as Array<keyof MediaEditorValues>).filter(key => this._current[key] !== update[key])
    Object.assign(this._current, update)
    this.dispatchEvent('changed', this._current, fields, isRestored)
  }

  commit(update: Partial<MediaEditorValues>) {
    const lastCommit = this._lastCommit
    const revertUpdate: Partial<MediaEditorValues> = {}
    for(const key in update) {
      // @ts-ignore
      revertUpdate[key] = lastCommit[key]
    }

    const command: MediaEditorCommand = {
      execute: () => {
        Object.assign(this._lastCommit, update)
        this.update(update, true)
      },
      undo: () => {
        Object.assign(this._lastCommit, revertUpdate)
        this.update(revertUpdate, true)
      }
    }

    this.undoStack.push(command)
    this.redoStack.length = 0
    command.execute()
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
      command.execute()
      this.undoStack.push(command)
    }
  }

  private get lastCommand() {
    return this.undoStack[this.undoStack.length - 1]
  }
}
