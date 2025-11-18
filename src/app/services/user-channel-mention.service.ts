import { Injectable, signal, ElementRef, inject, computed } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { FirestoreService } from './firestore.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavbarService } from '../services/navbar.service';
import { NavbarInterface } from '../interfaces/navbar.interface';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class UserMentionService {
  filteredUserList = computed(() =>
    this.firestoreService
      .userList()
      .filter((user) => user.name !== 'Guest')
  );
  filteredChannelList = signal<NavbarInterface[]>([]);
  channels = toSignal(inject(NavbarService).channelsObs$, {
    initialValue: [] as NavbarInterface[],
  });

  constructor(private firestoreService: FirestoreService, private router: Router) {
    this.filteredChannelList.set(this.getChannelWithUserMemmership());
  }

  tagInputStart(content: string, input: ElementRef<HTMLInputElement | HTMLTextAreaElement>): string {
    const newContent = content + '@';
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


  updateFilteredChannelList(content: string) {
    let list = this.getChannelWithUserMemmership();
    if (content.includes('#')) {
      const query = content.slice(1).toLowerCase();
      const querySecond = content.split('#').pop()?.toLowerCase();
      list = this.getChannelWithUserMemmership().filter(
        (channel) => channel.name.toLowerCase().includes(query) || channel.name.toLowerCase().includes(querySecond!)
      );
    } else if (content.endsWith('#')) {
      list = this.getChannelWithUserMemmership();
    }
    this.filteredChannelList.set(list!);
  }

  getChannelWithUserMemmership() {
    const uid = this.firestoreService.userProfile()?.uid;
    let list = this.channels().filter((channel) => channel.members?.some((member) => member.id == uid));
    return list;
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

  findChannel(id: string) {
    this.router.navigateByUrl(`channel/${id}`);
  }

  getChannelList(text: string) {
    let channelList = this.getChannelWithUserMemmership();
    let taggedChannels: { name: string, id: string, textIndex: number, taggedType: string }[] = [];

    channelList.forEach(channel => {
      const isTagged = text.search(channel.name)
      if (isTagged > 0) {
        let taggedText = `#${channel.name}`
        let textIndex = text.indexOf(taggedText)
        taggedChannels.push({
          name: channel.name,
          id: channel.channelId,
          textIndex: textIndex,
          taggedType: "channel"
        })
      }
    })
    return taggedChannels
  }

  getUserList(text: string) {
    let userList = this.filteredUserList();
    let taggedUsers: { name: string, id: string, textIndex: number, taggedType: string }[] = [];

    userList.forEach(user => {
      const isTagged = text.search(user.name);
      if (isTagged > 0) {
        let taggedText = `@${user.name}`
        let textIndex = text.indexOf(taggedText)
        taggedUsers.push({
          name: user.name,
          id: user.uid,
          textIndex: textIndex,
          taggedType: "user"
        })
      }

    })
    return taggedUsers
  }

  replaceTaggedText(taggedArray: { name: string, id: string, textIndex: number, taggedType: string }[], text: string, index:number) {
    let replacedText = text;
    taggedArray.forEach((tag) => {
      if (tag.taggedType == "user") {
        let customId = `${tag.id}_${tag.textIndex}_${index}`
        replacedText = replacedText.replace(`@${tag.name}`,
          `<span id="${customId}">@${tag.name}</span>`);
      } else if (tag.taggedType == "channel") {
        let customId = `${tag.id}_${tag.textIndex}_${index}`
        replacedText = replacedText.replace(`#${tag.name}`,
          `<span id="${customId}">#${tag.name}</span>`);
      }
    });
    return replacedText
  }
}
