import ButtonIcon from '../buttonIcon'

const className = 'angle-gauge'

import './angleGauge.scss'
import attachGrabListeners from '../../helpers/dom/attachGrabListeners'
import {attachClickEvent} from '../../helpers/dom/clickEvent'

const numberWidth = 42;
const gaugeWidth = 600;
const angles = [-180, -165, -150, -135, -120, -105, -90, -75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180]
const anglesWidth = angles.length * numberWidth
const zero = -(anglesWidth - gaugeWidth) / 2

const min = -45
const max = 45

export class AngleGauge {
  public container = document.createElement('div')
  public onChange: (value: number, final: boolean) => void
  public onRotate90: () => void
  public onFlip: () => void

  private numbers: HTMLDivElement;

  private startPos = 0
  private left = zero

  private value = 0

  private positionToValue(cssPosition: number) {
    return 360 / (anglesWidth - numberWidth) * (-cssPosition + zero)
  }

  private valueToPosition(value: number) {
    return -((anglesWidth - numberWidth) / 360 * value - zero)
  }

  private highlight(cssPosition: number) {
    const num = ((anglesWidth - numberWidth) / 2 + (-cssPosition + zero)) / 42
    const index = Math.round(num)
    const a = num - index
    const h = Math.abs(Math.abs(a) - 1) * 2 - 1

    const el = this.numbers.children[index] as HTMLDivElement
    this.container.querySelectorAll('.angle-gauge-number-text.active').forEach((d) => {
      d.classList.remove('active');
      (d as HTMLDivElement).style.transform = '';
    })
    const textEl = el.querySelector('.angle-gauge-number-text') as HTMLDivElement
    textEl.style.transform = `scale(${1 + h / 2})`
    textEl.classList.add('active')

    const dots = el.querySelector('.angle-gauge-dots') as HTMLDivElement
    const dotIndex = Math.round((a + 0.5) * (dots.children.length - 1))
    const dotEl = dots.children[dotIndex] as HTMLDivElement
    this.container.querySelectorAll('.angle-gauge-dot.active').forEach((d) => {
      d.classList.remove('active')
    })
    dotEl.classList.add('active')
  }

  public init() {
    this.highlight(this.left)
  }

  private skipClick = false

  public setValue(value: number) {
    this.value = value
    this.left = this.valueToPosition(value)
    this.highlight(this.left)
    this.numbers.style.left = `${this.left}px`
  }

  constructor() {
    this.container.classList.add(className)

    const gauge = document.createElement('div')
    gauge.classList.add(`${className}-gauge`)

    const numbers = document.createElement('div')
    this.numbers = numbers
    numbers.classList.add(`${className}-numbers`)
    numbers.style.left = `${this.left}px`

    for(const number of angles) {
      const numberEl = document.createElement('div')
      numberEl.classList.add(`${className}-number`)

      const text = document.createElement('div')
      text.classList.add(`${className}-number-text`)
      text.textContent = number.toString()

      const dots = document.createElement('div')
      dots.classList.add(`${className}-dots`)

      // each number has 7 dots
      for(let i = 0; i < 7; i++) {
        const dot = document.createElement('div')
        dot.classList.add(`${className}-dot`)
        if(i === 3) {
          dot.classList.add(`${className}-dot-center`)
        }
        dots.append(dot)
      }

      if(number <= max && number >= min) {
        attachClickEvent(text, () => {
          if(this.skipClick) {
            this.skipClick = false
            return
          }

          // change value smoothly from current to number
          let startTime: number | null = null
          const startValue = this.value
          const duration = 300
          const loop = () => {
            requestAnimationFrame((timestamp) => {
              if(!startTime) {
                startTime = timestamp
              }

              const progress = Math.min((timestamp - startTime) / duration, 1)
              const value = startValue + (number - startValue) * progress

              this.onChange?.(value, progress >= 1)
              this.value = value
              this.left = this.valueToPosition(value)
              this.highlight(this.left)
              numbers.style.left = `${this.left}px`

              if(progress < 1) {
                loop()
              }
            })
          }
          loop()
        })
      }

      numberEl.append(text, dots)
      numbers.append(numberEl)
    }

    const controls = document.createElement('div')
    controls.classList.add(`${className}-controls`)

    const rotateBtn = ButtonIcon('rotate')
    attachClickEvent(rotateBtn, () => {
      this.onRotate90?.()
    })

    const flipBtn = ButtonIcon('flip_image')
    attachClickEvent(flipBtn, () => {
      this.onFlip?.()
    })

    const arrow = document.createElement('div')
    arrow.classList.add(`${className}-arrow`)

    gauge.append(numbers, arrow)
    controls.append(rotateBtn, flipBtn)
    this.container.append(gauge, controls)

    attachGrabListeners(
      numbers,
      ({x}) => {
        this.startPos = x - this.left
        this.skipClick = false
      },
      ({x}) => {
        let left = x - this.startPos

        if(left === this.left) {
          return
        }
        this.skipClick = true

        let value = this.positionToValue(left)

        if(value < min) {
          left = this.valueToPosition(min)
          value = min
        }
        if(value > max) {
          left = this.valueToPosition(max)
          value = max
        }

        if(this.value !== value) {
          this.onChange?.(value, false)
        }
        this.value = value
        this.highlight(left)

        this.left = left
        numbers.style.left = `${left}px`
      },
      () => {
        this.onChange?.(this.value, true)
      }
    )
  }
}
