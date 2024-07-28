import {MediaEditorPath} from '../mediaEditorValues'

export function createBlurPainter(
  ctx: CanvasRenderingContext2D,
  blurCanvas: HTMLCanvasElement
) {
  return ({points, size}: MediaEditorPath) => {
    ctx.save()

    ctx.beginPath()

    for(let i = 0; i < points.length - 1; i++) {
      const vector = {
        x: points[i + 1].x - points[i].x,
        y: points[i + 1].y - points[i].y
      }
      const angle = Math.atan2(vector.y, vector.x)
      const sin = Math.sin(angle)
      const cos = Math.cos(angle)

      const rotate = (nx: number, ny: number) => {
        const xRot = nx * cos - ny * sin;
        const yRot = nx * sin + ny * cos;

        return {
          x: xRot + points[i].x,
          y: yRot + points[i].y
        };
      }

      if(i === 0) {
        const p0 = rotate(0, size)
        const p1 = rotate(-size, size)
        const p2 = rotate(-size, 0)
        const p3 = rotate(-size, -size)
        const p4 = rotate(0, -size)

        ctx.moveTo(p0.x, p0.y)
        ctx.arcTo(p1.x, p1.y, p2.x, p2.y, Math.abs(size))
        ctx.arcTo(p3.x, p3.y, p4.x, p4.y, Math.abs(size))
      } else {
        const p0 = rotate(0, -size)

        ctx.lineTo(p0.x, p0.y)
      }
    }
    for(let i = points.length - 1; i > 0; i--) {
      const vector = {
        x: points[i].x - points[i - 1].x,
        y: points[i].y - points[i - 1].y
      }
      const angle = Math.atan2(vector.y, vector.x)
      const sin = Math.sin(angle)
      const cos = Math.cos(angle)

      const rotate = (nx: number, ny: number) => {
        const xRot = nx * cos - ny * sin;
        const yRot = nx * sin + ny * cos;

        return {
          x: xRot + points[i].x,
          y: yRot + points[i].y
        };
      }

      if(i === points.length - 1) {
        const p0 = rotate(0, -size)
        const p1 = rotate(size, -size)
        const p2 = rotate(size, 0)
        const p3 = rotate(size, size)
        const p4 = rotate(0, size)

        ctx.lineTo(p0.x, p0.y)
        ctx.arcTo(p1.x, p1.y, p2.x, p2.y, Math.abs(size))
        ctx.arcTo(p3.x, p3.y, p4.x, p4.y, Math.abs(size))
      } else {
        const p0 = rotate(0, size)

        ctx.lineTo(p0.x, p0.y)
      }
    }

    ctx.clip('nonzero')
    ctx.drawImage(blurCanvas, 0, 0)
    ctx.restore()
  }
}
