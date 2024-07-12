import Button from '../../button'
import {_i18n} from '../../../lib/langPack'
import {buttonsSelector} from '../buttonsSelector'

const btn = 'media-editor-selector-btn';
const rbtn = 'media-editor-selector-btn icon-reverse';

export function cropTab(tab: HTMLDivElement) {
  const selector = document.createElement('div');
  selector.className = 'media-editor-aspect-ratio-selector';

  const span = document.createElement('span');
  _i18n(span, 'MediaEditor.AspectRatio');

  selector.append(
    Button(btn, {icon: 'aspect_ratio_free', text: 'MediaEditor.AspectRatio.Free'}),
    Button(btn, {icon: 'aspect_ratio_imageoriginal', text: 'MediaEditor.AspectRatio.Original'}),
    Button(btn, {icon: 'aspect_ratio_square', text: 'MediaEditor.AspectRatio.Square'}),
    Button(btn, {icon: 'aspect_ratio_3_2', text: 'MediaEditor.AspectRatio.3:2'}),
    Button(rbtn, {icon: 'aspect_ratio_3_2', text: 'MediaEditor.AspectRatio.2:3'}),
    Button(btn, {icon: 'aspect_ratio_4_3', text: 'MediaEditor.AspectRatio.4:3'}),
    Button(rbtn, {icon: 'aspect_ratio_4_3', text: 'MediaEditor.AspectRatio.3:4'}),
    Button(btn, {icon: 'aspect_ratio_5_4', text: 'MediaEditor.AspectRatio.5:4'}),
    Button(rbtn, {icon: 'aspect_ratio_5_4', text: 'MediaEditor.AspectRatio.4:5'}),
    Button(btn, {icon: 'aspect_ratio_7_5', text: 'MediaEditor.AspectRatio.7:5'}),
    Button(rbtn, {icon: 'aspect_ratio_7_5', text: 'MediaEditor.AspectRatio.5:7'}),
    Button(btn, {icon: 'aspect_ratio_16_9', text: 'MediaEditor.AspectRatio.16:9'}),
    Button(rbtn, {icon: 'aspect_ratio_16_9', text: 'MediaEditor.AspectRatio.9:16'})
  );

  const select = buttonsSelector(selector);
  select(0);

  tab.append(span, selector);
}
