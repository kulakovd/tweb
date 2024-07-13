import './mediaEditor.scss'
import ButtonIcon from '../buttonIcon'
import Icon from '../icon'
import {horizontalMenu} from '../horizontalMenu'
import {enhanceTab} from './tabs/enhanceTab'
import {cropTab} from './tabs/cropTab'
import {_i18n} from '../../lib/langPack'
import {textTab} from './tabs/textTab'
import {drawTab} from './tabs/drawTab'
import rootScope from '../../lib/rootScope'
import {AppManagers} from '../../lib/appManagers/managers'
import {stickersTab} from './tabs/stickersTab'
import {MediaEditorRenderer} from '../../lib/mediaEditor/mediaEditorRenderer'

const className = 'media-editor';

const toolsTabs: Array<{
  icon: Icon,
  value: string,
  fillContent?: (container: HTMLDivElement, me: MediaEditor) => void
}> = [
  {icon: 'enhance', value: 'enhance', fillContent: enhanceTab},
  {icon: 'crop', value: 'crop', fillContent: cropTab},
  {icon: 'text', value: 'text', fillContent: textTab},
  {icon: 'brush', value: 'draw', fillContent: drawTab},
  {icon: 'smile', value: 'stickers', fillContent: stickersTab}
]

export class MediaEditor {
  private bodyEl = document.body as HTMLBodyElement;

  private readonly container: HTMLElement;
  private readonly sidebar: HTMLElement;

  private readonly renderer: MediaEditorRenderer

  private selectTab: (id: number | HTMLElement, animate?: boolean) => void;
  public managers: AppManagers

  constructor() {
    this.managers = rootScope.managers;

    this.container = document.createElement('div');
    this.container.classList.add(className);

    const canvasContainer = document.createElement('div');
    canvasContainer.classList.add(`${className}-canvas-container`);
    this.container.append(canvasContainer);

    const canvas = document.createElement('canvas');
    canvas.classList.add(`${className}-canvas`);
    this.renderer = new MediaEditorRenderer(canvas);

    new ResizeObserver(([container]) => {
      const {width, height} = container.contentRect;
      this.renderer.updateSize(width, height);
    }).observe(canvasContainer);

    canvasContainer.append(canvas);

    this.sidebar = document.createElement('div');
    this.sidebar.classList.add(`${className}-sidebar`);
    this.container.append(this.sidebar);

    this.constructNavBar();
    const tabs = this.constructTabs();
    const content = this.constructContent();

    const doneBtn = ButtonIcon('check btn-circle rp btn-corner z-depth-1 btn-menu-toggle animated-button-icon');
    this.sidebar.append(doneBtn);

    this.selectTab = horizontalMenu(tabs, content);

    this.selectTab(0, false);
  }

  private constructNavBar() {
    const navBar = document.createElement('div');
    navBar.classList.add(`${className}-sidebar-navbar`);
    this.sidebar.append(navBar);

    const closeBtn = ButtonIcon('close');
    navBar.append(closeBtn);

    const title = document.createElement('div');
    title.classList.add(`${className}-sidebar-title`);
    _i18n(title, 'MediaEditor.Title');
    navBar.append(title);

    const undoBtn = ButtonIcon('undo');
    navBar.append(undoBtn);

    const redoBtn = ButtonIcon('redo');
    navBar.append(redoBtn);
  }

  private constructTabs() {
    const tabs = document.createElement('div');
    tabs .classList.add(`${className}-sidebar-tabs`, 'menu-horizontal-div');
    this.sidebar.append(tabs);

    toolsTabs.forEach(({icon, value}) => {
      const tab = this.createTab(icon, value);
      tabs.append(tab);
    });

    return tabs;
  }

  private createTab(icon: Icon, value: string) {
    const tab = document.createElement('div');
    tab.classList.add('media-editor-tab', 'menu-horizontal-div-item');

    const span = document.createElement('span');
    span.classList.add('menu-horizontal-div-item-span');
    tab.append(span);

    span.append(Icon(icon));
    span.append(document.createElement('i'));

    tab.dataset.value = value;
    return tab;
  }

  private constructContent() {
    const content = document.createElement('div');
    content.classList.add(`${className}-sidebar-content`, 'tabs-container');
    this.sidebar.append(content);

    toolsTabs.forEach(({value, fillContent}) => {
      const tabContent = document.createElement('div');
      tabContent.classList.add('tabs-tab', `${className}-sidebar-tab`, `${className}-sidebar-tab-${value}`);
      fillContent?.(tabContent, this)
      content.append(tabContent);
    })

    return content
  }

  open(media: HTMLImageElement) {
    this.bodyEl.append(this.container);
    this.renderer.loadMedia(media.src);
  }

  close() {
    this.container.remove();
  }
}

// setTimeout(() => {
//   new MediaEditor().open();
// }, 1000)
