import './colorSelector.scss';
import {buttonsSelector} from './buttonsSelector'
import {attachClickEvent} from '../../helpers/dom/clickEvent'
import ColorPicker, {ColorPickerColor} from '../colorPicker'

import colorPickerIcon from './assets/color-picker.png'

export const defaultColors = [
  '#FFFFFF',
  '#FE4438',
  '#FF8901',
  '#FFD60A',
  '#33C759',
  '#62E5E0',
  '#0A84FF',
  '#BD5CF3'
].map(color => color.toLowerCase());

const customColorGradient = `url("${colorPickerIcon}")`;

export function colorSelector(onChange?: (color: string) => void) {
  const pickerId = Math.random().toString(36).substring(2, 15);
  let selectedColor = defaultColors[0];

  const container = document.createElement('div');
  container.classList.add('color-selector');

  const colorsContainer = document.createElement('div');
  colorsContainer.classList.add('color-selector-colors', 'show-known-colors');

  defaultColors.forEach(color => {
    colorsContainer.append(createColor(color, color, true));
  });

  const customColorSwitch = createColor(customColorGradient, '#fff', false);
  customColorSwitch.classList.add('ignore-button')

  const customColorContainer = document.createElement('div');
  customColorContainer.classList.add('custom-color-slider-container');

  const select = buttonsSelector(colorsContainer, (colorIndex) => {
    customColorSwitch.classList.remove('selected');
    const color = defaultColors[colorIndex];
    selectedColor = color;
    onChange(color);
  });
  // select(0);

  function updateSelected(color: string) {
    const index = defaultColors.indexOf(color.toLowerCase());
    if(index !== -1) {
      select(index);
      customColorSwitch.classList.remove('selected');
    } else {
      customColorSwitch.classList.add('selected');
    }
  }

  const picker = new ColorPicker(pickerId);
  picker.onChange = (color: ColorPickerColor) => {
    onChange(color.hex);
    updateSelected(color.hex);
  };

  attachClickEvent(customColorSwitch, () => {
    // customColorSwitch.classList.toggle('selected');
    colorsContainer.classList.toggle('show-known-colors')
    customColorContainer.classList.toggle('visible');
    picker.container.classList.toggle('visible');
    picker.setColor(selectedColor);
  });

  const pickerSlider = picker.container.querySelector('.color-picker-sliders') as HTMLElement;
  customColorContainer.append(pickerSlider);

  const pickerBox = picker.container.querySelector('.color-picker-box') as HTMLElement;
  pickerBox.setAttribute('viewBox', '0 0 200 120');

  colorsContainer.append(
    customColorContainer,
    customColorSwitch
  );

  container.append(colorsContainer, picker.container);

  function selectColor(color: string) {
    picker.setColor(color);
  }

  return {container, selectColor};
}

function createColor(kernelColor: string, capsuleColor: string, known: boolean) {
  const item = document.createElement('div');
  item.classList.add('color-selector-color');
  if(known) {
    item.classList.add('known-color');
  }

  const capsule = document.createElement('div');
  capsule.classList.add('color-selector-capsule');
  capsule.style.background = capsuleColor;

  const kernel = document.createElement('div');
  kernel.classList.add('color-selector-kernel');
  kernel.style.background = kernelColor;

  item.append(capsule, kernel);
  return item;
}
