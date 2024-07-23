import Button from '../../button'
import {_i18n, LangPackKey} from '../../../lib/langPack'
import {buttonsSelector} from '../buttonsSelector'
import {MediaEditor} from '../mediaEditor'

const btn = 'media-editor-selector-btn';
const rbtn = 'media-editor-selector-btn icon-reverse';

const aspectRatioOptions: Array<{
  icon: Icon;
  text: LangPackKey;
  type: 'free' | 'original' | 'value';
  value?: number;
  reverse?: boolean;
}> = [
  {
    icon: 'aspect_ratio_free',
    text: 'MediaEditor.AspectRatio.Free',
    type: 'free'
  },
  {
    icon: 'aspect_ratio_imageoriginal',
    text: 'MediaEditor.AspectRatio.Original',
    type: 'original'
  },
  {
    icon: 'aspect_ratio_square',
    text: 'MediaEditor.AspectRatio.Square',
    type: 'value',
    value: 1
  },
  {
    icon: 'aspect_ratio_3_2',
    text: 'MediaEditor.AspectRatio.3:2',
    type: 'value',
    value: 3 / 2
  },
  {
    icon: 'aspect_ratio_3_2',
    text: 'MediaEditor.AspectRatio.2:3',
    type: 'value',
    reverse: true,
    value: 2 / 3
  },
  {
    icon: 'aspect_ratio_4_3',
    text: 'MediaEditor.AspectRatio.4:3',
    type: 'value',
    value: 4 / 3
  },
  {
    icon: 'aspect_ratio_4_3',
    text: 'MediaEditor.AspectRatio.3:4',
    type: 'value',
    reverse: true,
    value: 3 / 4
  },
  {
    icon: 'aspect_ratio_5_4',
    text: 'MediaEditor.AspectRatio.5:4',
    type: 'value',
    value: 5 / 4
  },
  {
    icon: 'aspect_ratio_5_4',
    text: 'MediaEditor.AspectRatio.4:5',
    type: 'value',
    reverse: true,
    value: 4 / 5
  },
  {
    icon: 'aspect_ratio_7_5',
    text: 'MediaEditor.AspectRatio.7:5',
    type: 'value',
    value: 7 / 5
  },
  {
    icon: 'aspect_ratio_7_5',
    text: 'MediaEditor.AspectRatio.5:7',
    type: 'value',
    reverse: true,
    value: 5 / 7
  },
  {
    icon: 'aspect_ratio_16_9',
    text: 'MediaEditor.AspectRatio.16:9',
    type: 'value',
    value: 16 / 9
  },
  {
    icon: 'aspect_ratio_16_9',
    text: 'MediaEditor.AspectRatio.9:16',
    type: 'value',
    reverse: true,
    value: 9 / 16
  }
];

export function cropTab(tab: HTMLDivElement, me: MediaEditor) {
  const selector = document.createElement('div');
  selector.className = 'media-editor-aspect-ratio-selector';

  const span = document.createElement('span');
  _i18n(span, 'MediaEditor.AspectRatio');

  aspectRatioOptions.forEach((option) => {
    selector.append(Button(option.reverse ? rbtn : btn, {icon: option.icon, text: option.text}));
  });

  const select = buttonsSelector(selector, (index) => {
    const option = aspectRatioOptions[index];
    if(option.type === 'free') {
      me.updateAspectRatio({type: 'free', index});
    } else if(option.type === 'original') {
      me.updateAspectRatio({type: 'original', index});
    } else if(option.type === 'value') {
      me.updateAspectRatio({type: 'value', index, value: option.value});
    }
  });
  select(0);

  me.state.addEventListener('changed', (values, fields) => {
    if(fields.includes('crop')) {
      if(values.crop) {
        select(values.crop.aspectRatioIndex, true);
      }
    }
  });

  tab.append(span, selector);
}
