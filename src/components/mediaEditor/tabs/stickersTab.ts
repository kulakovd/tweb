import {MediaEditor} from '../mediaEditor'
import StickersTab from '../../emoticonsDropdown/tabs/stickers'
import {EmoticonsDropdown} from '../../emoticonsDropdown'

export function stickersTab(tab: HTMLDivElement, me: MediaEditor) {
  const resizeObserver = new ResizeObserver((entries) => {
    const {height, width} = entries[0].contentRect;
    dropdownEl.style.setProperty('--height', `${height}px`);
    dropdownEl.style.setProperty('--width', `${width}px`);
  });

  resizeObserver.observe(tab)
  const stickers = new StickersTab(me.managers);
  const emoticonsDropdown = new EmoticonsDropdown({
    tabsToRender: [stickers],
    customParentElement: tab as HTMLElement,
    skipRightsCheck: true
  })
  emoticonsDropdown.onButtonClick();
  emoticonsDropdown.onMediaClick = (media) => Promise.resolve(false);
  // disable close on click outside
  emoticonsDropdown.toggle = () => Promise.resolve();
  const dropdownEl = (tab.querySelector('.emoji-dropdown') as HTMLDivElement)
  dropdownEl.style.setProperty('--height', `${tab.clientHeight}px`)
  dropdownEl.style.setProperty('--width', `${tab.clientWidth}px`);
}
