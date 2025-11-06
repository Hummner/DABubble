import { Component, ViewChild, ElementRef, computed, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
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
import { Observable, startWith, map} from 'rxjs';
import { Message } from '../interfaces/message.interface';
import { MessageTicketComponent } from '../direct-messages/message-ticket/message-ticket.component';
import { ClickStopPropagation } from '../click-stop-propagation.directive';
import { FirestoreService } from '../services/firestore.service';
import { DirectMessageService } from '../services/direct-message.service';
import { MessageService } from '../services/message.service';
import { ChannelsService } from '../services/channels.service';
import { serverTimestamp } from '@angular/fire/firestore';
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
    MessageTicketComponent,
    ClickStopPropagation,
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
  userProfile = this.firestoreService.userProfile;
  content = '';
  localMessages: Message[] = [];
  addressControl = new FormControl('');
  selectedTags = signal<Array<{ type: 'user' | 'channel'; id: string; name: string; imgUrl?: string }>>([]);
  showAutocomplete = signal(false);
  currentInput = signal<string>('');
  isSending = signal(false);
  lastSentMessage = signal<string>('');
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

  constructor(
    public firestoreService: FirestoreService,
    public emojiService: EmojiServiceService,
    public userMentionService: UserMentionService,
    private directMessageService: DirectMessageService,
    private messageService: MessageService,
    private channelsService: ChannelsService
  ) {
    this.filteredOptions = this.addressControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || ''))
    );

    console.log(this.localMessages);
  }

  private _filter(value: string): Array<{ type: 'user' | 'channel'; data: UserProfileInterface | NavbarInterface }> {
    if (!value || (!value.includes('@') && !value.includes('#'))) {
      return [];
    }

    const options: Array<{ type: 'user' | 'channel'; data: UserProfileInterface | NavbarInterface }> = [];
    this._addUserOptions(value, options);
    this._addChannelOptions(value, options);
    return options;
  }

  private _addUserOptions(
    value: string,
    options: Array<{ type: 'user' | 'channel'; data: UserProfileInterface | NavbarInterface }>
  ): void {
    if (value.includes('@')) {
      const query = this._getLastQuery(value, '@').toLowerCase();
      const filteredUsers = this.userMentionService.filteredUserList().filter((user) => user.name.toLowerCase().includes(query));
      options.push(...filteredUsers.map((user) => ({ type: 'user' as const, data: user })));
    }
  }

  private _addChannelOptions(
    value: string,
    options: Array<{ type: 'user' | 'channel'; data: UserProfileInterface | NavbarInterface }>
  ): void {
    if (value.includes('#')) {
      const query = this._getLastQuery(value, '#').toLowerCase();
      const filteredChannels = this.userMentionService
        .filteredChannelList()
        .filter((channel) => channel.name.toLowerCase().includes(query));
      options.push(...filteredChannels.map((channel) => ({ type: 'channel' as const, data: channel })));
    }
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
    if (this._shouldShowAutocomplete(value)) {
      this.showAutocomplete.set(true);
      this.updateFilteredLists(value);
    } else {
      this.showAutocomplete.set(false);
    }
  }

  private _shouldShowAutocomplete(value: string): boolean {
    if (!value.includes('@') && !value.includes('#')) return false;
    const lastAtIndex = value.lastIndexOf('@');
    const lastHashIndex = value.lastIndexOf('#');
    return (
      (lastAtIndex !== -1 && value.length - lastAtIndex <= 20) || (lastHashIndex !== -1 && value.length - lastHashIndex <= 20)
    );
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
    if (content.includes('#')) {
      this.userMentionService.updateFilteredChannelList(content);
    }
  }

  selectOption(option: { type: 'user' | 'channel'; data: UserProfileInterface | NavbarInterface }): void {
    const newTag = this._createTagFromOption(option);
    if (this._isTagAlreadySelected(newTag)) return;
    this.selectedTags.update((tags) => [...tags, newTag]);
    this._clearInputs();
  }

  private _createTagFromOption(option: { type: 'user' | 'channel'; data: UserProfileInterface | NavbarInterface }) {
    return {
      type: option.type,
      id: option.type === 'user' ? (option.data as UserProfileInterface).uid : (option.data as NavbarInterface).channelId,
      name: option.data.name,
      imgUrl: option.type === 'user' ? (option.data as UserProfileInterface).imgUrl : undefined,
    };
  }

  private _isTagAlreadySelected(newTag: any): boolean {
    return this.selectedTags().findIndex((tag) => tag.type === newTag.type && tag.id === newTag.id) !== -1;
  }

  private _clearInputs(): void {
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

  async addLocalMessage() {
    const senderId = this.userProfile()?.uid;
    if (!this._canSendMessage(senderId)) return;
    this.isSending.set(true);
    const message = this._createMessage(senderId!);
    try {
      await this.sendToSelectedRecipients(message);
      this._handleSuccessfulSend(message);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      this.isSending.set(false);
    }
  }

  private _canSendMessage(senderId?: string): boolean {
    return !!(senderId && this.content.trim().length > 0 && this.selectedTags().length > 0 && !this.isSending());
  }

  private _createMessage(senderId: string): Message {
    return {
      createdAt: serverTimestamp(),
      senderId: senderId,
      content: this.content.trim(),
      hasThread: false,
      threadCount: 0,
    };
  }

  private _handleSuccessfulSend(message: Message): void {
    this.localMessages.push(message);
    this.content = '';
    const recipientText = this.getSelectedRecipientsText();
    this.lastSentMessage.set(`Message sent to ${recipientText}`);
    setTimeout(() => this.lastSentMessage.set(''), 3000);
    this.clearAllTags();
  }

  private async sendToSelectedRecipients(message: Message) {
    const currentUserId = this.userProfile()?.uid;
    if (!currentUserId) return;
    const userRecipients = this.selectedTags().filter((tag) => tag.type === 'user');
    const channelRecipients = this.selectedTags().filter((tag) => tag.type === 'channel');
    await this._sendToUsers(message, userRecipients, currentUserId);
    await this._sendToChannels(message, channelRecipients, currentUserId);
  }

  private async _sendToUsers(message: Message, userRecipients: any[], currentUserId: string): Promise<void> {
    for (const userTag of userRecipients) {
      try {
        const dmChannelId = await this.directMessageService.getDMChannel(currentUserId, userTag.id);
        await this.messageService.addMessage(message, dmChannelId);
      } catch (error) {
        console.error(`Error sending message to user ${userTag.name}:`, error);
      }
    }
  }

  private async _sendToChannels(message: Message, channelRecipients: any[], currentUserId: string): Promise<void> {
    for (const channelTag of channelRecipients) {
      try {
        await this.channelsService.addTicketToChannel(channelTag.id, currentUserId, message.content);
      } catch (error) {
        console.error(`Error sending message to channel ${channelTag.name}:`, error);
      }
    }
  }

  canSendMessage(): boolean {
    return this.content.trim().length > 0 && this.selectedTags().length > 0 && !this.isSending();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.canSendMessage()) {
        this.addLocalMessage();
      }
    }
  }

  getSelectedRecipientsText(): string {
    const tags = this.selectedTags();
    if (tags.length === 0) return '';
    if (tags.length === 1) return this._getSingleRecipientText(tags[0]);
    return this._getMultipleRecipientsText(tags);
  }

  private _getSingleRecipientText(tag: any): string {
    return tag.type === 'user' ? `@${tag.name}` : `#${tag.name}`;
  }

  private _getMultipleRecipientsText(tags: any[]): string {
    const userCount = tags.filter((t) => t.type === 'user').length;
    const channelCount = tags.filter((t) => t.type === 'channel').length;
    let result = '';
    if (userCount > 0) {
      result += `${userCount} user${userCount > 1 ? 's' : ''}`;
    }
    if (channelCount > 0) {
      if (result) result += ' and ';
      result += `${channelCount} channel${channelCount > 1 ? 's' : ''}`;
    }
    return result;
  }
}
