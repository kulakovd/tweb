import './rangeSlider.scss'
import {_i18n, LangPackKey} from '../../lib/langPack'

type RangeSliderParams = {
  min: number;
  max: number;
  value: number;
  label: LangPackKey;
  onChange: (value: number) => void;
  highlight?: boolean;
  color?: string;
};

export function rangeSlider(params: RangeSliderParams) {
  let sliderColor = params.color ?? 'var(--white)';

  const container = document.createElement('div');
  container.classList.add('range-slider-container');
  container.style.setProperty('--color', sliderColor);

  const header = document.createElement('div');
  header.classList.add('range-slider-header');

  const label = document.createElement('span');
  label.classList.add('range-slider-label');
  _i18n(label, params.label);

  const value = document.createElement('span');
  value.classList.add('range-slider-value');
  value.innerText = '' + params.value;

  const range = document.createElement('input');
  range.classList.add('range-slider');
  range.type = 'range';
  range.min = '' + params.min;
  range.max = '' + params.max;
  range.value = '' + params.value;

  function handleChange() {
    const mapped0 = (0 - params.min) / (params.max - params.min) * 100;
    const mappedValue = (+range.value - params.min) / (params.max - params.min) * 100;

    const firstBrake = Math.min(mapped0, mappedValue);
    const secondBrake = Math.max(mapped0, mappedValue);

    container.style.setProperty('--gradient', `linear-gradient(to right, var(--gray) ${firstBrake}%, var(--color) ${firstBrake}%, var(--color) ${secondBrake}%, var(--gray) ${secondBrake}%)`);
    value.innerText = '' + range.value;
    value.classList.toggle('value-changed', (params.highlight ?? false) && params.value !== +range.value);
  }

  range.addEventListener('input', () => {
    params.onChange(+range.value);
    handleChange()
  });

  handleChange()

  header.append(label, value);
  container.append(header, range);

  function updateColor(color?: string) {
    sliderColor = color ?? 'var(--white)';
    container.style.setProperty('--color', sliderColor);
  }

  return {
    container,
    updateColor
  };
}
