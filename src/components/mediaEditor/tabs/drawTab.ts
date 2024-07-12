import {rangeSlider} from '../rangeSlider'
import {colorSelector} from '../colorSelector'
import ripple from '../../ripple'

import toolPenImage from '../assets/tool_pen.svg';
import toolArrowImage from '../assets/tool_arrow.svg';
import toolBrushImage from '../assets/tool_brush.svg';
import toolNeonImage from '../assets/tool_neon.svg';
import toolEraserImage from '../assets/tool_eraser.svg';
import toolBlurImage from '../assets/tool_blur.svg';
import {_i18n, i18n, LangPackKey} from '../../../lib/langPack'
import {buttonsSelector} from '../buttonsSelector'

type ToolDefinition = {
  icon: string;
  value: string;
  i18key: LangPackKey;
  defaultColor?: string;
}

const tools: Array<ToolDefinition> = [
  {icon: toolPenImage, value: 'pen', i18key: 'MediaEditor.Draw.Tool.Pen', defaultColor: '#FE4438'},
  {icon: toolArrowImage, value: 'arrow', i18key: 'MediaEditor.Draw.Tool.Arrow', defaultColor: '#FFD60A'},
  {icon: toolBrushImage, value: 'brush', i18key: 'MediaEditor.Draw.Tool.Brush', defaultColor: '#FF8901'},
  {icon: toolNeonImage, value: 'neon', i18key: 'MediaEditor.Draw.Tool.Neon', defaultColor: '#62E5E0'},
  {icon: toolEraserImage, value: 'eraser', i18key: 'MediaEditor.Draw.Tool.Eraser'},
  {icon: toolBlurImage, value: 'blur', i18key: 'MediaEditor.Draw.Tool.Blur'}
]

export function drawTab(tab: HTMLElement) {
  let currentTools = 'pen'
  const toolsColors: Record<string, string> = {
    pen: '#FE4438',
    arrow: '#FFD60A',
    brush: '#FF8901',
    neon: '#62E5E0'
  }

  const sizeRange = rangeSlider({
    min: 2,
    max: 48,
    value: 24,
    label: 'MediaEditor.Text.Size',
    onChange: () => {}
  });

  const toolSelector = document.createElement('div');
  toolSelector.classList.add('media-editor-tool-selector');

  const toolSelectorBtns = document.createElement('div');
  toolSelectorBtns.classList.add('media-editor-tool-selector');

  for(const tool of tools) {
    const toolEl = createTool(tool);
    toolSelectorBtns.append(toolEl);
  }

  const selectTool = buttonsSelector(toolSelectorBtns, (idx) => {
    currentTools = tools[idx].value;
    if(toolsColors[currentTools]) {
      colors.selectColor(toolsColors[currentTools]);
      sizeRange.updateColor(toolsColors[currentTools]);
    }
  })

  const toolSelectorLabel = document.createElement('div');
  toolSelectorLabel.classList.add('media-editor-selector-label');
  _i18n(toolSelectorLabel, 'MediaEditor.Draw.Tool');

  const colors = colorSelector((color) => {
    sizeRange.updateColor(color);
    if(toolsColors[currentTools]) {
      toolsColors[currentTools] = color;
      const idx = tools.findIndex(tool => tool.value === currentTools);
      const toolEl = toolSelectorBtns.children[idx] as HTMLElement
      toolEl.style.setProperty('--selected-color', color);
    }
  })

  selectTool(0);

  toolSelector.append(toolSelectorLabel, toolSelectorBtns);

  tab.append(
    colors.container,
    sizeRange.container,
    toolSelector
  );
}

function createTool(tool: ToolDefinition) {
  const button = document.createElement('button');
  if(tool.defaultColor) button.style.setProperty('--selected-color', tool.defaultColor);
  button.classList.add('media-editor-tool-btn', 'media-editor-selector-btn');
  ripple(button);

  const btnContent = document.createElement('div');
  btnContent.classList.add('media-editor-tool-btn-content');

  const toolImg = document.createElement('div');
  toolImg.classList.add('media-editor-tool-btn-img');
  btnContent.append(toolImg);

  fetch(tool.icon)
  .then(res => res.text())
  .then(res => {
    // to make currentColor work in svg
    toolImg.innerHTML = res;
  })

  btnContent.append(i18n(tool.i18key));

  button.append(btnContent);

  return button;
}
