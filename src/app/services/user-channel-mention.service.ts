import { Injectable, signal, ElementRef, inject } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { FirestoreService } from './firestore.service';
import { UserProfileInterface } from '../interfaces/user-profile.interface';
import { ChannelInterface } from '../interfaces/channel.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavbarService } from '../services/navbar.service';
import { NavbarInterface } from '../interfaces/navbar.interface';

@Injectable({
  providedIn: 'root',
})
export class UserMentionService {
  filteredUserList = signal<UserProfileInterface[]>([]);
  filteredChannelList = signal<NavbarInterface[]>([]);
  channels = toSignal(inject(NavbarService).channelsObs$, {
    initialValue: [] as NavbarInterface[],
  });

  constructor(private firestoreService: FirestoreService) {}

  tagInputStart(content: string, input: ElementRef<HTMLInputElement | HTMLTextAreaElement>): string {
    const newContent = content + '@';
    this.firestoreService.subUserList((users) => {
      this.updateFilteredUserList(newContent);
    });
    requestAnimationFrame(() => {
      if (input && input.nativeElement) input.nativeElement.focus();
    });
    return newContent;
  }

  tagChannelInputStart(content: string, input: ElementRef<HTMLInputElement | HTMLTextAreaElement>): string {
    const newContent = content + '#';
    this.updateFilteredChannelList(newContent);
    requestAnimationFrame(() => {
      if (input && input.nativeElement) input.nativeElement.focus();
    });
    return newContent;
  }

  updateFilteredUserList(content: string) {
    const uid = this.firestoreService.userProfile()?.uid;
    let list = this.firestoreService.userList();
    if (content.includes('@')) {
      const query = content.slice(1).toLowerCase();
      const querySecond = content.split('@').pop()?.toLowerCase();
      list = list.filter(
        (user) =>
          user.uid !== uid &&
          user.name !== 'Guest' &&
          (user.name.toLowerCase().includes(query) || user.name.toLowerCase().includes(querySecond!))
      );
    } else if (content.endsWith('@')) {
      list = this.firestoreService.userList().filter((user) => user.uid !== uid && user.name !== 'Guest');
    }
    this.filteredUserList.set(list);
  }

  updateFilteredChannelList(content: string) {
    let list = this.channels();
    if (content.includes('#')) {
      const query = content.slice(1).toLowerCase();
      const querySecond = content.split('#').pop()?.toLowerCase();
      list = this.channels().filter(
        (channel) => channel.name.toLowerCase().includes(query) || channel.name.toLowerCase().includes(querySecond!)
      );
    } else if (content.endsWith('#')) {
      list = this.channels();
    }
    this.filteredChannelList.set(list!);
  }

  takeUser(name: string, content: string): string {
    const lastAtIndex = content.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const before = content.slice(0, lastAtIndex);
      const after = content.slice(lastAtIndex);
      const afterWithoutAt = after.slice(1).split(/\s/)[0];
      const remaining = content.slice(lastAtIndex + afterWithoutAt.length + 1);
      return `${before}@${name} ${remaining}`.trim();
    }
    return content;
  }

  takeChannel(name: string, content: string): string {
    const lastAtIndex = content.lastIndexOf('#');
    if (lastAtIndex !== -1) {
      const before = content.slice(0, lastAtIndex);
      const after = content.slice(lastAtIndex);
      const afterWithoutAt = after.slice(1).split(/\s/)[0];
      const remaining = content.slice(lastAtIndex + afterWithoutAt.length + 1);
      return `${before}#${name} ${remaining}`.trim();
    }
    return content;
  }

  onInputChange(
    content: string,
    mentionMenuTrigger: MatMenuTrigger,
    channelMenuTrigger: MatMenuTrigger,
    input: ElementRef<HTMLInputElement | HTMLTextAreaElement>
  ) {
    this.onEmptyInput(mentionMenuTrigger, channelMenuTrigger, content);
    const lastChar = content[content.length - 1];
    const hasAt = content.includes('@') || lastChar === '@';
    const hasHash = content.includes('#') || lastChar === '#';
    if (hasAt) {
      this.firestoreService.subUserList(() => this.updateFilteredUserList(content));
      if (lastChar === '@') this.onTypeEt(channelMenuTrigger, mentionMenuTrigger, input);
    }
    if (hasHash) {
      this.updateFilteredChannelList(content);
      if (lastChar === '#') this.onTypeHashtag(channelMenuTrigger, mentionMenuTrigger, input);
    }
  }

  onTypeEt(channelTrig: MatMenuTrigger, menuTrig: MatMenuTrigger, input: ElementRef) {
    channelTrig.closeMenu();
    menuTrig.openMenu();
    requestAnimationFrame(() => {
      if (input.nativeElement) input.nativeElement.focus();
    });
  }

  onTypeHashtag(channelTrig: MatMenuTrigger, menuTrig: MatMenuTrigger, input: ElementRef) {
    menuTrig.closeMenu();
    channelTrig.openMenu();
    requestAnimationFrame(() => {
      if (input.nativeElement) input.nativeElement.focus();
    });
  }

  onEmptyInput(mTrig: MatMenuTrigger, chTrig: MatMenuTrigger, cont: string) {
    if (cont.length === 0) {
      mTrig.closeMenu();
      chTrig.closeMenu();
      return;
    }
  }
}
