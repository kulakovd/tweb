export type Point = {
  x: number,
  y: number
}

export type Vector = {
  x: number,
  y: number
}

export type Segment = [Point, Point]

export class Rect {
  private _topLeft: Point;
  private _bottomRight: Point;

  private _rotation = 0;

  public clone() {
    const r = new Rect();
    r._topLeft = {...this._topLeft};
    r._bottomRight = {...this._bottomRight};
    r._rotation = this._rotation;
    return r;
  }

  static from2Points(p1: Point, p2: Point) {
    const r = new Rect();
    r._topLeft = {x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y)};
    r._bottomRight = {x: Math.max(p1.x, p2.x), y: Math.max(p1.y, p2.y)};
    return r;
  }

  get leftSegment(): Segment {
    return [this.topLeft, this.bottomLeft];
  }

  get rightSegment(): Segment {
    return [this.topRight, this.bottomRight];
  }

  get topSegment(): Segment {
    return [this.topLeft, this.topRight];
  }

  get bottomSegment(): Segment {
    return [this.bottomLeft, this.bottomRight];
  }

  get diagonal1(): Segment {
    return [this.topLeft, this.bottomRight];
  }

  get diagonal2(): Segment {
    return [this.topRight, this.bottomLeft];
  }

  get width(): number {
    return this._bottomRight.x - this._topLeft.x;
  }

  get height(): number {
    return this._bottomRight.y - this._topLeft.y;
  }

  get topLeft(): Point {
    return this.rotatePoint(this._topLeft);
  }

  get topRight(): Point {
    return this.rotatePoint({x: this._bottomRight.x, y: this._topLeft.y});
  }

  get bottomLeft(): Point {
    return this.rotatePoint({x: this._topLeft.x, y: this._bottomRight.y});
  }

  get bottomRight(): Point {
    return this.rotatePoint(this._bottomRight);
  }

  set topLeft(value: Point) {
    this._topLeft = value;
  }

  set topRight(value: Point) {
    this._bottomRight = {x: value.x, y: this._bottomRight.y};
    this._topLeft = {x: this._topLeft.x, y: value.y};
  }

  set bottomLeft(value: Point) {
    this._topLeft = {x: value.x, y: this._topLeft.y};
    this._bottomRight = {x: this._bottomRight.x, y: value.y};
  }

  set bottomRight(value: Point) {
    this._bottomRight = value;
  }

  public move(vector: Vector) {
    this._topLeft = {
      x: this._topLeft.x + vector.x,
      y: this._topLeft.y + vector.y
    }
    this._bottomRight = {
      x: this._bottomRight.x + vector.x,
      y: this._bottomRight.y + vector.y
    }
  }

  set rotation(value: number) {
    this._rotation = value;
  }

  get rotation() {
    return this._rotation;
  }

  private get center(): Point {
    return {
      x: (this._topLeft.x + this._bottomRight.x) / 2,
      y: (this._topLeft.y + this._bottomRight.y) / 2
    };
  }

  private rotatePoint(point: Point, rot: number = this._rotation): Point {
    const rad = rot * (Math.PI / 180);
    const center = this.center;

    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const nx = point.x - center.x;
    const ny = point.y - center.y;

    const xRot = nx * cos - ny * sin;
    const yRot = nx * sin + ny * cos;

    return {
      x: xRot + center.x,
      y: yRot + center.y
    };
  }

  private unrotatePoint(point: Point): Point {
    return this.rotatePoint(point, -this._rotation);
  }

  public isInside(point: Point): boolean {
    const rotatedPoint = this.unrotatePoint(point);
    return rotatedPoint.x >= this._topLeft.x && rotatedPoint.x <= this._bottomRight.x &&
      rotatedPoint.y >= this._topLeft.y && rotatedPoint.y <= this._bottomRight.y;
  }
}

export function findPerpendicularPointOnLine(segment: Segment, point: Point): Point {
  const [A, B] = segment;

  // Вектор направления прямой
  const direction: Vector = {x: B.x - A.x, y: B.y - A.y};

  // Перпендикулярный вектор
  const perpDirection: Vector = {x: -direction.y, y: direction.x};

  // Нормирование перпендикулярного вектора
  const length = Math.sqrt(perpDirection.x * perpDirection.x + perpDirection.y * perpDirection.y);
  const normPerpDirection: Vector = {x: perpDirection.x / length, y: perpDirection.y / length};

  // Нахождение точки на прямой, которая будет перпендикулярна исходному отрезку
  const dotProduct = ((point.x - A.x) * direction.x + (point.y - A.y) * direction.y) /
    (direction.x * direction.x + direction.y * direction.y);
  const projX = A.x + dotProduct * direction.x;
  const projY = A.y + dotProduct * direction.y;

  // Используем проекцию для нахождения перпендикулярной точки
  const perpendicularPoint: Point = {
    x: projX - normPerpDirection.x,
    y: projY - normPerpDirection.y
  };

  return perpendicularPoint;
}

export function getIntersection(segment1: Segment, segment2: Segment): Point | null {
  // Вычисляем коэффициенты для уравнений прямых
  const [{x: x1, y: y1}, {x: x2, y: y2}] = segment1;
  const A1 = y2 - y1;
  const B1 = x1 - x2;
  const C1 = A1 * x1 + B1 * y1;

  const [{x: x3, y: y3}, {x: x4, y: y4}] = segment2;
  const A2 = y4 - y3;
  const B2 = x3 - x4;
  const C2 = A2 * x3 + B2 * y3;

  const denominator = A1 * B2 - A2 * B1;

  if(denominator === 0) {
    // Прямые параллельны
    return null;
  }

  // Вычисляем координаты точки пересечения
  const intersectX = (C1 * B2 - C2 * B1) / denominator;
  const intersectY = (A1 * C2 - A2 * C1) / denominator;

  // Проверяем, находится ли точка пересечения на обоих отрезках
  const onSegment1 = Math.min(x1, x2) <= intersectX && intersectX <= Math.max(x1, x2) &&
    Math.min(y1, y2) <= intersectY && intersectY <= Math.max(y1, y2);
  const onSegment2 = Math.min(x3, x4) <= intersectX && intersectX <= Math.max(x3, x4) &&
    Math.min(y3, y4) <= intersectY && intersectY <= Math.max(y3, y4);

  if(onSegment1 && onSegment2) {
    return {x: intersectX, y: intersectY};
  }

  return null; // Отрезки не пересекаются
}
