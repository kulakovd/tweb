import {attachClickEvent} from '../../helpers/dom/clickEvent'
import findUpAsChild from '../../helpers/dom/findUpAsChild'

export function buttonsSelector(buttons: HTMLElement, onClick?: (id: number, el: HTMLElement) => void) {
  function clearSelection() {
    buttons.querySelectorAll('.selected').forEach((el) => el.classList.remove('selected'));
  }

  attachClickEvent(buttons, (e: MouseEvent) => {
    let target = e.target as HTMLElement;
    target = findUpAsChild(target, buttons);
    if(!target || target.classList.contains('ignore-button')) return;
    clearSelection();
    target.classList.add('selected');
    if(onClick) {
      onClick(Array.from(buttons.children).indexOf(target), target);
    }
  });

  return (id: number | HTMLElement | undefined, ignore?: boolean) => {
    clearSelection();
    if(id === undefined) return;
    const newSelected = id instanceof HTMLElement ? id : buttons.children[id];
    newSelected.classList.add('selected');
    if(onClick && !ignore) {
      onClick(id instanceof HTMLElement ? Array.from(buttons.children).indexOf(id) : id, newSelected as HTMLElement);
    }
  }
}
