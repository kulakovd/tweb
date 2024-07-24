import attachGrabListeners from '../../helpers/dom/attachGrabListeners'
import {findPerpendicularPointOnLine, getIntersection, Point, Rect, Vector} from '../../lib/mediaEditor/geometry'
import './cropper.scss';
import {MediaEditorState} from '../../lib/mediaEditor/mediaEditorState'
import {AngleGauge} from './angleGauge'

const className = 'image-cropper';

const moveAnimDuration = 400;

export class Cropper {
  public container: HTMLElement;

  private cropRect: Rect = new Rect();
  private imageRect: Rect = new Rect();
  private hasChanged = false;

  private inited = false

  private scale = 1;
  private aspectRatioIndex = 0;
  private transformRotation = 0;

  private prevValue: Rect | null = null;
  private prevRotation = this.imageRect.rotation;
  private prevTransformRotation = this.transformRotation;

  private calcCropRect(cropRect: Rect) {
    const bounds = this.imageRect.boundingBox;
    return {
      x: (cropRect.topLeft.x - bounds.topLeft.x) / this.scale,
      y: (cropRect.topLeft.y - bounds.topLeft.y) / this.scale,
      width: cropRect.width / this.scale,
      height: cropRect.height / this.scale,
      aspectRatio: cropRect.aspectRatio,
      aspectRatioIndex: this.aspectRatioIndex
    }
  }

  private commitCrop() {
    const newValue = this.cropRect.clone();
    if(this.prevValue !== null &&
      newValue.equals(this.prevValue) &&
      this.imageRect.rotation === this.prevRotation &&
      this.transformRotation === this.prevTransformRotation
    ) {
      return;
    }
    this.prevValue = newValue;
    this.prevRotation = this.imageRect.rotation;
    this.state.commit({
      crop: this.calcCropRect(newValue),
      rotation: this.imageRect.rotation,
      transformRotation: this.transformRotation
    })
  }

  constructor(private state: MediaEditorState, private angleGauge: AngleGauge) {
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
          this.commitCrop();
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
              // TODO commit before animation
              this.commitCrop();
            }
          });
        }

        loop();
      }
    );

    this.container.append(grid);

    angleGauge.onChange = (rotation, final) => {
      this.updateRotation(rotation, final);
    }
    angleGauge.onRotate90 = () => {
      this.state.rotateCounterClockwise();
    }
    angleGauge.onFlip = () => {
      this.state.commitFlip();
    }

    state.addEventListener('changed', (values, fields) => {
      if(fields.includes('crop') || fields.includes('rotation')) {
        angleGauge.setValue(values.rotation);
        this.imageRect.rotation = values.rotation;
        const bounds = this.imageRect.boundingBox;
        const x = bounds.topLeft.x + values.crop.x * this.scale;
        const y = bounds.topLeft.y + values.crop.y * this.scale;
        const width = values.crop.width * this.scale;
        const height = values.crop.height * this.scale;
        this.cropRect = Rect.from2Points(
          {x, y},
          {x: x + width, y: y + height}
        );
        this.cropRect.setAspectRatioWithoutChangingSize(values.crop.aspectRatio);
        this.setCoords(this.cropRect);
      }
    })
  }

  public update({
    rect, scale, isRestored
  }: {
    rect: Rect,
    scale: number,
    isRestored: boolean
  }) {
    this.transformRotation = this.state.current.transformRotation;
    this.scale = scale;
    const rotation = this.imageRect.rotation;
    this.imageRect = rect.clone();
    this.imageRect.rotation = rotation;

    if(!this.hasChanged) {
      this.cropRect = this.cropRect.clone();
      this.cropRect.topLeft = rect.topLeft;
      this.cropRect.bottomRight = rect.bottomRight;
    }

    this.setCoords(this.resizeToFil(this.cropRect));

    if(isRestored) {
      return;
    }

    if(this.inited) {
      this.commitCrop();
    } else {
      this.inited = true;
      this.state.setDefaultCrop(this.calcCropRect(this.cropRect));
    }
  }

  public updateRotation(rotation: number, final: boolean) {
    this.imageRect.rotation = rotation;
    this.state.update({
      rotation
    })

    if(!this.hasChanged) {
      this.cropRect = this.imageRect.clone();
      this.cropRect.rotation = 0;
    }

    const cropRect = this.resizeToFil(this.cropRect);
    this.setCoords(cropRect);
    if(final) {
      this.commitCrop();
    }
  }

  public setAspectRatio(aspectRatio: number | null, index: number) {
    if(this.aspectRatioIndex === index) {
      return;
    }
    this.aspectRatioIndex = index;
    const cropRect = this.cropRect.clone()
    if(this.imageRect.width > 0) {
      cropRect.setAspectRatio(aspectRatio, this.imageRect.width, this.imageRect.height);
      this.hasChanged = true;
    }
    this.setCoords(this.resizeToFil(cropRect));
    this.commitCrop();
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
      const topLeftOutside = !imageRect.isInsideOfSegment(cropRect.topLeft, rotation < 0 ? 'top' : 'left');
      const topRightOutside = !imageRect.isInsideOfSegment(cropRect.topRight, rotation < 0 ? 'right' : 'top');
      const bottomRightOutside = !imageRect.isInsideOfSegment(cropRect.bottomRight, rotation < 0 ? 'bottom' : 'right');
      const bottomLeftOutside = !imageRect.isInsideOfSegment(cropRect.bottomLeft, rotation < 0 ? 'left' : 'bottom');

      if(topLeftOutside) {
        const targetSeg = rotation < 0 ? imageRect.topSegment : imageRect.leftSegment;
        const point = findPerpendicularPointOnLine(targetSeg, cropRect.topLeft);
        moveVector.x += point.x - cropRect.topLeft.x;
        moveVector.y += point.y - cropRect.topLeft.y;
      }

      if(topRightOutside) {
        const targetSeg = rotation < 0 ? imageRect.rightSegment : imageRect.topSegment;
        const point = findPerpendicularPointOnLine(targetSeg, cropRect.topRight);
        moveVector.x += point.x - cropRect.topRight.x;
        moveVector.y += point.y - cropRect.topRight.y;
      }

      if(bottomRightOutside) {
        const targetSeg = rotation < 0 ? imageRect.bottomSegment : imageRect.rightSegment;
        const point = findPerpendicularPointOnLine(targetSeg, cropRect.bottomRight);
        moveVector.x += point.x - cropRect.bottomRight.x;
        moveVector.y += point.y - cropRect.bottomRight.y;
      }

      if(bottomLeftOutside) {
        const targetSeg = rotation < 0 ? imageRect.leftSegment : imageRect.bottomSegment;
        const point = findPerpendicularPointOnLine(targetSeg, cropRect.bottomLeft);
        moveVector.x += point.x - cropRect.bottomLeft.x;
        moveVector.y += point.y - cropRect.bottomLeft.y;
      }
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
