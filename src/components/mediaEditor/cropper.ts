import attachGrabListeners from '../../helpers/dom/attachGrabListeners'
import {findPerpendicularPointOnLine, getIntersection, Point, Rect, Vector} from '../../lib/mediaEditor/geometry'
import './cropper.scss';
import {MediaEditorValues} from '../../lib/mediaEditor/mediaEditorValues'

const className = 'image-cropper';

const moveAnimDuration = 400;

export class Cropper {
  public container: HTMLElement;
  public onChange: (value: MediaEditorValues['crop']) => void;

  private cropRect: Rect = new Rect();
  private imageRect: Rect = new Rect();
  private hasChanged = false;

  private scale = 1;

  private prevValue: Rect | null = null;
  private prevRotation = this.imageRect.rotation;
  private updateValue() {
    if(this.onChange) {
      const newValue = this.cropRect.clone();
      if(this.prevValue !== null && newValue.equals(this.prevValue) && this.imageRect.rotation === this.prevRotation) {
        return;
      }

      this.prevValue = newValue;
      this.prevRotation = this.imageRect.rotation;

      const bounds = this.imageRect.boundingBox;
      this.onChange({
        x: (newValue.topLeft.x - bounds.topLeft.x) / this.scale,
        y: (newValue.topLeft.y - bounds.topLeft.y) / this.scale,
        width: newValue.width / this.scale,
        height: newValue.height / this.scale
      });
    }
  }

  constructor() {
    this.container = document.createElement('div');
    this.container.classList.add(className);

    (['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).forEach((corner) => {
      const handle = document.createElement('div');
      handle.classList.add(`${className}-handle`, `${className}-handle-${corner}`);
      this.container.append(handle);

      const startPoint: Point = {x: 0, y: 0};
      let startRect = this.cropRect.clone();
      attachGrabListeners(
        handle,
        ({x, y}) => {
          startRect = this.cropRect.clone();
          startPoint.x = x - startRect[corner].x;
          startPoint.y = y - startRect[corner].y;
        },
        ({x, y}) => {
          startRect[corner] = {
            x: x - startPoint.x,
            y: y - startPoint.y
          }

          this.hasChanged = true;
          const cropRect = this.resizeToFil(startRect);
          this.setCoords(cropRect);
        },
        () => {
          this.updateValue();
        }
      );
    })

    const grid = document.createElement('div');
    grid.classList.add(`${className}-grid`);

    const startPoint: Point = {x: 0, y: 0};
    let startRect = this.cropRect.clone();
    let animMoveVector: Vector = {x: 0, y: 0};
    let stopAnimation = false;

    attachGrabListeners(
      grid,
      ({x, y}) => {
        startRect = this.cropRect.clone();
        startRect.move({
          x: -x,
          y: -y
        });
        startPoint.x = x - startRect.topLeft.x;
        startPoint.y = y - startRect.topLeft.y;
        animMoveVector = {x: 0, y: 0};
        stopAnimation = true;
      },
      ({x, y}) => {
        this.hasChanged = true;
        const newRect = startRect.clone();
        newRect.move({x, y})

        const {cropRect, moveVector} = this.moveToFit(newRect);
        animMoveVector = moveVector;
        this.setCoords(cropRect);
      },
      () => {
        stopAnimation = false;
        let startTime = 0;
        const startRect = this.cropRect.clone();

        const loop = () => {
          if(stopAnimation) {
            return;
          }

          requestAnimationFrame((timestamp) => {
            // animation move
            if(startTime === 0) {
              startTime = timestamp;
            }
            const elapsed = (timestamp - startTime) / moveAnimDuration;
            if(elapsed < 1) {
              const x = animMoveVector.x * elapsed;
              const y = animMoveVector.y * elapsed;
              const cropRect = startRect.clone();
              cropRect.move({x, y});
              this.setCoords(cropRect);
              loop();
            } else {
              startRect.move(animMoveVector);
              this.setCoords(startRect);
              this.updateValue();
            }
          });
        }

        loop();
      }
    );

    this.container.append(grid);
  }

  public update({
    x, y, width, height, scale
  }: {
    x: number,
    y: number,
    width: number,
    height: number,
    scale: number,
  }) {
    this.scale = scale;
    this.imageRect = Rect.from2Points(
      {x, y},
      {x: x + width, y: y + height}
    );

    if(!this.hasChanged) {
      this.cropRect = this.cropRect.clone();
      this.cropRect.topLeft = {x, y};
      this.cropRect.bottomRight = {x: x + width, y: y + height};

      this.setCoords(this.resizeToFil(this.cropRect));
      this.updateValue();
    }
  }

  public updateRotation(rotation: number) {
    this.imageRect.rotation = rotation;
    const cropRect = this.resizeToFil(this.cropRect);
    this.setCoords(cropRect);
    this.updateValue();
  }

  public setAspectRatio(aspectRatio: number) {
    const cropRect = this.cropRect.clone()
    if(this.imageRect.width > 0) {
      cropRect.setAspectRatio(aspectRatio, this.imageRect.width, this.imageRect.height);
      this.hasChanged = true;
    }
    this.setCoords(this.resizeToFil(cropRect));
    this.updateValue();
  }

  private moveToFit(_cropRect: Rect): {
    cropRect: Rect,
    moveVector: Vector
  } {
    const imageRect = this.imageRect;
    const cropRect = _cropRect.clone()
    const moveVector: Vector = {x: 0, y: 0};

    const rotation = imageRect.rotation;

    if(rotation === 0) {
      if(cropRect.topLeft.x < imageRect.topLeft.x) {
        moveVector.x += imageRect.topLeft.x - cropRect.topLeft.x;
      }
      if(cropRect.topLeft.y < imageRect.topLeft.y) {
        moveVector.y += imageRect.topLeft.y - cropRect.topLeft.y;
      }
      if(cropRect.bottomRight.x > imageRect.bottomRight.x) {
        moveVector.x += imageRect.bottomRight.x - cropRect.bottomRight.x;
      }
      if(cropRect.bottomRight.y > imageRect.bottomRight.y) {
        moveVector.y += imageRect.bottomRight.y - cropRect.bottomRight.y;
      }
    } else {
      const topLeftOutside = !imageRect.isInside(cropRect.topLeft);
      const topRightOutside = !imageRect.isInside(cropRect.topRight);
      const bottomRightOutside = !imageRect.isInside(cropRect.bottomRight);
      const bottomLeftOutside = !imageRect.isInside(cropRect.bottomLeft);

      const diagonal1vectors = [];
      const diagonal2vectors = [];

      if(topLeftOutside) {
        const targetSeg = rotation < 0 ? imageRect.topSegment : imageRect.leftSegment;
        const point = findPerpendicularPointOnLine(targetSeg, cropRect.topLeft);
        diagonal1vectors.push({
          x: point.x - cropRect.topLeft.x,
          y: point.y - cropRect.topLeft.y
        });
      }

      if(topRightOutside) {
        const targetSeg = rotation < 0 ? imageRect.rightSegment : imageRect.topSegment;
        const point = findPerpendicularPointOnLine(targetSeg, cropRect.topRight);
        diagonal2vectors.push({
          x: point.x - cropRect.topRight.x,
          y: point.y - cropRect.topRight.y
        });
      }

      if(bottomRightOutside) {
        const targetSeg = rotation < 0 ? imageRect.bottomSegment : imageRect.rightSegment;
        const point = findPerpendicularPointOnLine(targetSeg, cropRect.bottomRight);
        diagonal1vectors.push({
          x: point.x - cropRect.bottomRight.x,
          y: point.y - cropRect.bottomRight.y
        });
      }

      if(bottomLeftOutside) {
        const targetSeg = rotation < 0 ? imageRect.leftSegment : imageRect.bottomSegment;
        const point = findPerpendicularPointOnLine(targetSeg, cropRect.bottomLeft);
        diagonal2vectors.push({
          x: point.x - cropRect.bottomLeft.x,
          y: point.y - cropRect.bottomLeft.y
        });
      }

      const addDiagonalVector = (vectors: Vector[]) => {
        let shortestVector: Vector | null = null;
        let shortestVectorLength = Infinity;
        vectors.forEach((vector) => {
          const len = vector.x * vector.x + vector.y * vector.y;
          if(len < shortestVectorLength) {
            shortestVector = vector;
            shortestVectorLength = len;
          }
        });
        if(shortestVector !== null) {
          moveVector.x += shortestVector.x;
          moveVector.y += shortestVector.y;
        }
      }

      addDiagonalVector(diagonal1vectors);
      addDiagonalVector(diagonal2vectors);
    }

    return {cropRect, moveVector};
  }

  private resizeToFil(_cropRect: Rect): Rect {
    const imageRect = this.imageRect;
    const cropRect = _cropRect.clone()

    if(imageRect.rotation !== 0) {
      const cropTopLeft = getIntersection(
        imageRect.leftSegment,
        cropRect.diagonal1
      ) || getIntersection(
        imageRect.topSegment,
        cropRect.diagonal1
      )

      if(cropTopLeft !== null) {
        cropRect.topLeft = cropTopLeft;
      }

      const cropBottomRight = getIntersection(
        imageRect.rightSegment,
        cropRect.diagonal1
      ) || getIntersection(
        imageRect.bottomSegment,
        cropRect.diagonal1
      );

      if(cropBottomRight !== null) {
        cropRect.bottomRight = cropBottomRight;
      }

      const cropTopRight = getIntersection(
        imageRect.rightSegment,
        cropRect.diagonal2
      ) || getIntersection(
        imageRect.topSegment,
        cropRect.diagonal2
      );

      if(cropTopRight !== null) {
        cropRect.topRight = cropTopRight;
      }

      const cropBottomLeft = getIntersection(
        imageRect.leftSegment,
        cropRect.diagonal2
      ) || getIntersection(
        imageRect.bottomSegment,
        cropRect.diagonal2
      );

      if(cropBottomLeft !== null) {
        cropRect.bottomLeft = cropBottomLeft;
      }
    } else {
      if(cropRect.topLeft.x < imageRect.topLeft.x) {
        cropRect.topLeft = {x: imageRect.topLeft.x, y: cropRect.topLeft.y};
      }
      if(cropRect.topLeft.y < imageRect.topLeft.y) {
        cropRect.topLeft = {x: cropRect.topLeft.x, y: imageRect.topLeft.y};
      }
      if(cropRect.bottomRight.x > imageRect.bottomRight.x) {
        cropRect.bottomRight = {x: imageRect.bottomRight.x, y: cropRect.bottomRight.y};
      }
      if(cropRect.bottomRight.y > imageRect.bottomRight.y) {
        cropRect.bottomRight = {x: cropRect.bottomRight.x, y: imageRect.bottomRight.y};
      }
    }

    return cropRect;
  }

  private setCoords(cropRect: Rect) {
    this.cropRect = cropRect;
    const {style} = this.container;
    style.left = `${cropRect.topLeft.x}px`;
    style.top = `${cropRect.topLeft.y}px`;
    style.width = `${cropRect.width}px`;
    style.height = `${cropRect.height}px`;
  }
}
