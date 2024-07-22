// TODO split filters and other values
export type MediaEditorValues = {
  enhance: number
  brightness: number
  contrast: number
  saturation: number
  warmth: number
  fade: number
  highlights: number
  shadows: number
  vignette: number
  grain: number
  sharpen: number
  rotation: number
  transformRotation: number
  flip: boolean
  // Coordinates of the crop rectangle relative to the image bounds
  crop: null | {
    x: number
    y: number
    width: number
    height: number
  }
}

export const defaultMediaEncoderValues: MediaEditorValues = {
  enhance: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  fade: 0,
  highlights: 0,
  shadows: 0,
  vignette: 0,
  grain: 0,
  sharpen: 0,
  rotation: 0,
  transformRotation: 0,
  flip: false,
  crop: null
}
