import { Component, ViewChild, ElementRef, computed, signal, AfterViewInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { EmojiServiceService } from '../services/emoji.service';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { UserMentionService } from '../services/user-channel-mention.service';
import { UserProfileInterface } from '../interfaces/user-profile.interface';
import { NavbarInterface } from '../interfaces/navbar.interface';
import { Observable, startWith, map, combineLatest } from 'rxjs';

@Component({
  selector: 'app-new-message',
  standalone: true,
  imports: [
    MatMenuModule,
    MatSidenavModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './new-message.component.html',
  styleUrl: './new-message.component.scss',
})
export class NewMessageComponent {
  @ViewChild('addressInput') addressInput!: ElementRef<HTMLInputElement>;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger!: MatAutocompleteTrigger;
  @ViewChild('addressContainer') addressContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('inputNew') inputNew!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('mentionTriggerNew') mentionMenuTriggerNew!: MatMenuTrigger;
  @ViewChild('channelTriggerNew') channelMenuTriggerNew!: MatMenuTrigger;

  content = '';
  addressControl = new FormControl('');
  selectedTags = signal<Array<{ type: 'user' | 'channel'; id: string; name: string; imgUrl?: string }>>([]);
  showAutocomplete = signal(false);
  currentInput = signal<string>('');
  filteredOptions: Observable<Array<{ type: 'user' | 'channel'; data: UserProfileInterface | NavbarInterface }>>;

  filteredUsers = computed(() => {
    const value = this.currentInput();
    if (!value.includes('@')) return [];
    const query = this._getLastQuery(value, '@').toLowerCase();
    return this.userMentionService.filteredUserList().filter((user) => user.name.toLowerCase().includes(query));
  });

  filteredChannels = computed(() => {
    const value = this.currentInput();
    if (!value.includes('#')) return [];
    const query = this._getLastQuery(value, '#').toLowerCase();
    return this.userMentionService.filteredChannelList().filter((channel) => channel.name.toLowerCase().includes(query));
  });

  constructor(public emojiService: EmojiServiceService, public userMentionService: UserMentionService) {
    this.filteredOptions = this.addressControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || ''))
    );
  }

  private _filter(value: string): Array<{ type: 'user' | 'channel'; data: UserProfileInterface | NavbarInterface }> {
    if (!value || (!value.includes('@') && !value.includes('#'))) {
      return [];
    }
    const options: Array<{ type: 'user' | 'channel'; data: UserProfileInterface | NavbarInterface }> = [];
    if (value.includes('@')) {
      const query = this._getLastQuery(value, '@').toLowerCase();
      const filteredUsers = this.userMentionService.filteredUserList().filter((user) => user.name.toLowerCase().includes(query));
      options.push(...filteredUsers.map((user) => ({ type: 'user' as const, data: user })));
    }
    if (value.includes('#')) {
      const query = this._getLastQuery(value, '#').toLowerCase();
      const filteredChannels = this.userMentionService
        .filteredChannelList()
        .filter((channel) => channel.name.toLowerCase().includes(query));
      options.push(...filteredChannels.map((channel) => ({ type: 'channel' as const, data: channel })));
    }
    return options;
  }

  private _getLastQuery(value: string, symbol: string): string {
    const lastIndex = value.lastIndexOf(symbol);
    if (lastIndex === -1) return '';
    const afterSymbol = value.slice(lastIndex + 1);
    const spaceIndex = afterSymbol.indexOf(' ');
    return spaceIndex === -1 ? afterSymbol : afterSymbol.slice(0, spaceIndex);
  }

  onInputChange(event: any): void {
    const value = event.target.value;
    this.currentInput.set(value);
    if (value.includes('@') || value.includes('#')) {
      const lastAtIndex = value.lastIndexOf('@');
      const lastHashIndex = value.lastIndexOf('#');
      const hasRecentSymbol =
        (lastAtIndex !== -1 && value.length - lastAtIndex <= 20) || (lastHashIndex !== -1 && value.length - lastHashIndex <= 20);
      if (hasRecentSymbol) {
        this.showAutocomplete.set(true);
        this.updateFilteredLists(value);
      } else {
        this.showAutocomplete.set(false);
      }
    } else {
      this.showAutocomplete.set(false);
    }
  }

  onFocus(): void {
    const value = this.addressControl.value || '';
    this.currentInput.set(value);
    if (value.includes('@') || value.includes('#')) {
      this.showAutocomplete.set(true);
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.showAutocomplete.set(false);
    }, 300);
  }

  private updateFilteredLists(content: string): void {
    if (content.includes('@')) {
      this.userMentionService.updateFilteredUserList(content);
    }
    if (content.includes('#')) {
      this.userMentionService.updateFilteredChannelList(content);
    }
  }

  selectOption(option: { type: 'user' | 'channel'; data: UserProfileInterface | NavbarInterface }): void {
    const currentValue = this.addressControl.value || '';
    const symbol = option.type === 'user' ? '@' : '#';
    const newTag = {
      type: option.type,
      id: option.type === 'user' ? (option.data as UserProfileInterface).uid : (option.data as NavbarInterface).channelId,
      name: option.data.name,
      imgUrl: option.type === 'user' ? (option.data as UserProfileInterface).imgUrl : undefined,
    };
    const existingTagIndex = this.selectedTags().findIndex((tag) => tag.type === newTag.type && tag.id === newTag.id);
    if (existingTagIndex === -1) {
      this.selectedTags.update((tags) => [...tags, newTag]);
    }
    this.addressControl.setValue('');
    this.currentInput.set('');
    this.showAutocomplete.set(false);
  }

  removeTag(index: number): void {
    this.selectedTags.update((tags) => tags.filter((_, i) => i !== index));
  }

  clearAllTags(): void {
    this.selectedTags.set([]);
    this.addressControl.setValue('');
    this.currentInput.set('');
  }

  getTagDisplayName(tag: { type: 'user' | 'channel'; id: string; name: string; imgUrl?: string }): string {
    return tag.type === 'user' ? `@${tag.name}` : `#${tag.name}`;
  }

  focusInput(): void {
    setTimeout(() => {
      this.addressInput?.nativeElement?.focus();
    }, 0);
  }

  displayFn(option: { type: 'user' | 'channel'; data: UserProfileInterface | NavbarInterface }): string {
    return '';
  }

  tagInputStart() {
    this.content = this.userMentionService.tagInputStart(this.content, this.inputNew);
  }

  tagInputChannelStart() {
    this.content = this.userMentionService.tagChannelInputStart(this.content, this.inputNew);
  }
  onEmojiClick(emoji: any) {
    this.addEmoji(emoji.code);
    this.emojiService.selectEmoji(emoji.name);
  }
  addEmoji(emoji: any) {
    this.content = this.emojiService.addEmojiToContent(emoji, this.content);
  }
  takeUser(name: string) {
    this.content = this.userMentionService.takeUser(name, this.content);
  }
  takeChannel(name: string) {
    this.content = this.userMentionService.takeChannel(name, this.content);
  }
}
