import { Injectable, signal, ElementRef } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { FirestoreService } from './firestore.service';
import { UserProfileInterface } from '../interfaces/user-profile.interface';

@Injectable({
  providedIn: 'root',
})
export class UserMentionService {
  filteredUserList = signal<UserProfileInterface[]>([]);

  constructor(private firestoreService: FirestoreService) {}

  tagInputStart(content: string, input: ElementRef<HTMLInputElement>): string {
    const newContent = content + '@';
    this.firestoreService.subUserList((users) => {
      this.updateFilteredUserList(newContent);
    });
    setTimeout(() => {
      input.nativeElement.focus();
    }, 0);
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
          (user.name.toLowerCase().includes(query) ||
            user.name.toLowerCase().includes(querySecond!))
      );
    } else if (content.endsWith('@')) {
      list = this.firestoreService
        .userList()
        .filter((user) => user.uid !== uid && user.name !== 'Guest');
    }
    this.filteredUserList.set(list);
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

  onInputChange(
    content: string,
    mentionMenuTrigger: MatMenuTrigger,
    input: ElementRef<HTMLInputElement>
  ) {
    this.firestoreService.subUserList((users) => {
      this.updateFilteredUserList(content);
    });
    const chars = content.split('');
    const lastChar = chars.length - 1;
    if (chars[lastChar] == '@') {
      mentionMenuTrigger.openMenu();
      setTimeout(() => {
        input.nativeElement.focus();
      }, 0);
    }
    if (content.length == 0) {
      mentionMenuTrigger.closeMenu();
    }
  }
}
