import { SliderTab } from "../../slider";
import AppSelectPeers from "../../appSelectPeers";
import appSidebarLeft, { AppSidebarLeft } from "..";
import appDialogsManager from "../../../lib/appManagers/appDialogsManager";
import appPeersManager from "../../../lib/appManagers/appPeersManager";
import appUsersManager from "../../../lib/appManagers/appUsersManager";
import { MyDialogFilter as DialogFilter } from "../../../lib/storages/filters";
import rootScope from "../../../lib/rootScope";
import { copy } from "../../../helpers/object";

export default class AppIncludedChatsTab implements SliderTab {
  public container: HTMLElement;
  private closeBtn: HTMLElement;
  private confirmBtn: HTMLElement;
  private title: HTMLElement;

  private selector: AppSelectPeers;
  private type: 'included' | 'excluded';
  private filter: DialogFilter;
  private originalFilter: DialogFilter;

  init() {
    this.container = document.querySelector('.included-chatlist-container');
    this.closeBtn = this.container.querySelector('.sidebar-close-button');
    this.confirmBtn = this.container.querySelector('.btn-confirm');
    this.title = this.container.querySelector('.sidebar-header__title');

    this.confirmBtn.addEventListener('click', () => {
      const selected = this.selector.getSelected();

      //this.filter.pFlags = {};

      if(this.type == 'included') {
        for(const key in this.filter.pFlags) {
          if(key.indexOf('exclude_') === 0) {
            continue;
          }

          // @ts-ignore
          delete this.filter.pFlags[key];
        }
      } else {
        for(const key in this.filter.pFlags) {
          if(key.indexOf('exclude_') !== 0) {
            continue;
          }

          // @ts-ignore
          delete this.filter.pFlags[key];
        }
      }

      const peers: number[] = [];
      for(const key of selected) {
        if(typeof(key) === 'number') {
          peers.push(key);
        } else {
          // @ts-ignore
          this.filter.pFlags[key] = true;
        }
      }

      if(this.type == 'included') {
        this.filter.pinned_peers = this.filter.pinned_peers.filter(peerId => {
          return peers.includes(peerId); // * because I have pinned peer in include_peers too
          /* const index = peers.indexOf(peerId);
          if(index !== -1) {
            peers.splice(index, 1);
            return true;
          } else {
            return false;
          } */
        });
      } else {
        this.filter.pinned_peers = this.filter.pinned_peers.filter(peerId => {
          return !peers.includes(peerId);
        });
      }

      const other = this.type == 'included' ? 'exclude_peers' : 'include_peers';
      this.filter[other] = this.filter[other].filter(peerId => {
        return !peers.includes(peerId);
      });
      
      this.filter[this.type == 'included' ? 'include_peers' : 'exclude_peers'] = peers;
      //this.filter.pinned_peers = this.filter.pinned_peers.filter(peerId => this.filter.include_peers.includes(peerId));

      appSidebarLeft.editFolderTab.setFilter(this.filter, false);
      appSidebarLeft.closeTab(AppSidebarLeft.SLIDERITEMSIDS.includedChats);
    });
  }

  checkbox(selected?: boolean) {
    return `<div class="checkbox"><label class="checkbox-field"><input type="checkbox" ${selected ? 'checked' : ''}><span></span></label></div>`;
  }

  renderResults = async(peerIds: number[]) => {
    //const other = this.type == 'included' ? this.filter.exclude_peers : this.filter.include_peers;

    await appUsersManager.getContacts();
    peerIds.forEach(peerId => {
      //if(other.includes(peerId)) return;

      const {dom} = appDialogsManager.addDialogNew({
        dialog: peerId,
        container: this.selector.scrollable,
        drawStatus: false,
        rippleEnabled: false,
        avatarSize: 46
      });

      const selected = this.selector.selected.has(peerId);
      dom.containerEl.insertAdjacentHTML('beforeend', this.checkbox(selected));
      if(selected) dom.listEl.classList.add('active');

      let subtitle = '';

      if(peerId > 0) {
        if(peerId == rootScope.myId) {
          subtitle = 'Chat with yourself';
        } else if(appUsersManager.isBot(peerId)) {
          subtitle = 'Bot';
        } else {
          subtitle = appUsersManager.contactsList.has(peerId) ? 'Contact' : 'Non-Contact';
        }
      } else {
        subtitle = appPeersManager.isBroadcast(peerId) ? 'Channel' : 'Group';
      }

      dom.lastMessageSpan.innerHTML = subtitle;
    });
  };

  onOpen() {
    if(this.init) {
      this.init();
      this.init = null;
    }

    this.confirmBtn.style.display = this.type == 'excluded' ? '' : 'none';
    this.title.innerText = this.type == 'included' ? 'Included Chats' : 'Excluded Chats';

    const filter = this.filter;

    const fragment = document.createDocumentFragment();
    const dd = document.createElement('div');
    dd.classList.add('sidebar-left-h2');
    dd.innerText = 'Chat types';
    
    const categories = document.createElement('div');
    categories.classList.add('folder-categories');

    let details: any;
    if(this.type == 'excluded') {
      details = {
        exclude_muted: {ico: 'tgico-mute', text: 'Muted'},
        exclude_archived: {ico: 'tgico-archive', text: 'Archived'},
        exclude_read: {ico: 'tgico-readchats', text: 'Read'}
      };
    } else {
      details = {
        contacts: {ico: 'tgico-newprivate', text: 'Contacts'},
        non_contacts: {ico: 'tgico-noncontacts', text: 'Non-Contacts'},
        groups: {ico: 'tgico-group', text: 'Groups'},
        broadcasts: {ico: 'tgico-newchannel', text: 'Channels'},
        bots: {ico: 'tgico-bots', text: 'Bots'}
      };
    }

    let html = '';
    for(const key in details) {
      html += `<div class="folder-category-button ${details[key].ico}" data-peerId="${key}"><p>${details[key].text}</p>${this.checkbox()}</div>`;
    }
    categories.innerHTML = html;

    const hr = document.createElement('hr');
    hr.style.margin = '7px 0 9px';

    const d = document.createElement('div');
    d.classList.add('sidebar-left-h2');
    d.innerText = 'Chats';

    fragment.append(dd, categories, hr, d);

    /////////////////

    const selectedPeers = (this.type == 'included' ? filter.include_peers : filter.exclude_peers).slice();

    this.selector = new AppSelectPeers(this.container, this.onSelectChange, ['dialogs'], null, this.renderResults);
    this.selector.selected = new Set(selectedPeers);
    this.selector.input.placeholder = 'Search';

    const _add = this.selector.add.bind(this.selector);
    this.selector.add = (peerId, title) => {
      const div = _add(peerId, details[peerId]?.text);
      if(details[peerId]) {
        div.querySelector('avatar-element').classList.add(details[peerId].ico);
      }
      return div;
    };

    this.selector.list.parentElement.insertBefore(fragment, this.selector.list);

    selectedPeers.forEach(peerId => {
      this.selector.add(peerId);
    });

    for(const flag in filter.pFlags) {
      // @ts-ignore
      if(details.hasOwnProperty(flag) && !!filter.pFlags[flag]) {
        (categories.querySelector(`[data-peerId="${flag}"]`) as HTMLElement).click();
      }
    }

    // ! потому что onOpen срабатывает раньше, чем блок отрисовывается, и высоты нет
    setTimeout(() => {
      this.selector.selectedScrollable.scrollTo(this.selector.selectedScrollable.scrollHeight, 'top', false, true);
    }, 0);
  }

  onSelectChange = (length: number) => {
    //const changed = !deepEqual(this.filter, this.originalFilter);
    if(this.type == 'included') {
      this.confirmBtn.style.display = length ? '' : 'none';
    }
  };

  onCloseAfterTimeout() {
    if(this.selector) {
      this.selector.container.remove();
      this.selector = null;
    }
  }

  open(filter: DialogFilter, type: 'included' | 'excluded') {
    this.originalFilter = filter;
    this.filter = copy(this.originalFilter);
    this.type = type;

    appSidebarLeft.selectTab(AppSidebarLeft.SLIDERITEMSIDS.includedChats);
  }
}