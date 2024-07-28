export type MediaEditorDrawState = {
  tool: 'pen' | 'arrow' | 'brush' | 'neon' | 'eraser' | 'blur'
  color?: string
  size: number
}

export type MediaEditorTextState = {
  color: string
  fontSize: number
  fontFamily: string
  align: 'left' | 'center' | 'right'
  frame: 'none' | 'black' | 'white'
}

export type MediaEditorText = {
  type: 'text'
  position: {x: number, y: number},
  content: string
  fontSize: number
  fontFamily: string
  color: string
  align: 'left' | 'center' | 'right'
  frame: 'none' | 'black' | 'white'
  rotation: number
}

export type MediaEditorPath = {
  type: 'path'
  tool: MediaEditorDrawState['tool']
  color: string
  size: number
  completed: boolean
  points: Array<{x: number, y: number}>
}

// TODO split filters and other values
export type MediaEditorValues = {
  filters: {
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
  },
  rotation: number
  transformRotation: number
  flip: boolean
  // Coordinates of the crop rectangle relative to the image bounds
  crop: null | {
    x: number
    y: number
    width: number
    height: number
    aspectRatio: number
    aspectRatioIndex: number
  },
  selectedPainting: null | number
  paintings: Array<MediaEditorPath>
  stickers: Array<MediaEditorText>
}

export const defaultMediaEncoderValues: MediaEditorValues = {
  filters: {
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
    sharpen: 0
  },
  rotation: 0,
  transformRotation: 0,
  flip: false,
  crop: null,
  selectedPainting: null,
  paintings: [],
  stickers: []
}
