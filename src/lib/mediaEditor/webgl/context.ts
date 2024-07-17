export type MediaEditorRenderingContext = {
  gl: WebGL2RenderingContext
  mapVertices: (v: number, t: number, r?: 'direct' | 'invert') => void
}
