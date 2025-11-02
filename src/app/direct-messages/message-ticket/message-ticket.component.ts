import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges } from '@angular/core';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { Message } from '../../interfaces/message.interface';
import { CommonModule } from '@angular/common';
import { Timestamp } from '@angular/fire/firestore';
import { FirestoreService } from '../../services/firestore.service';
import { Router } from '@angular/router';
import { DirectMessageService } from '../../services/direct-message.service';
import { NavbarInterface } from '../../interfaces/navbar.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavbarService } from '../../services/navbar.service';
import { EmojiServiceService } from '../../services/emoji.service';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../services/message.service';
import { ThreadDirectMessageService } from '../../services/thread-direct-message.service';
import { UserMentionService } from '../../services/user-channel-mention.service';

type MessageToken =
  | { type: 'text'; value: string }
  | { type: 'mentionUser'; userName: string }
  | { type: 'mentionChannel'; channelName: string };

@Component({
  selector: 'app-message-ticket',
  standalone: true,
  imports: [MatMenuTrigger, CommonModule, MatIconModule, MatMenuModule, FormsModule],
  templateUrl: './message-ticket.component.html',
  styleUrl: './message-ticket.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageTicketComponent implements OnChanges, OnInit, OnDestroy {
  @Input() userProfileB!: UserProfileInterface | null;
  @Input() userProfile!: UserProfileInterface | null;
  @Input() message!: Message;
  @Input() channelId!: string;
  @Input() threadId?: string;
  @Input() messageId!: string;
  @Input() inThreadView: boolean = false;
  @Input() isParentInThread: boolean = false;
  @Input() disableFloatingMenu: boolean = false;
  @Input() isMobileScreen: boolean = false;
  @Output() openThread = new EventEmitter<string | undefined>();
  @Output() emojiListChange = new EventEmitter<{ name: string; code: string }[]>();
  @Output() editViewChange = new EventEmitter<boolean>();
  @ViewChild('editInput') editInput!: ElementRef<HTMLInputElement>;
  @ViewChild('editThreadInput') editThreadInput!: ElementRef<HTMLInputElement>;
  private userMap = new Map<string, UserProfileInterface>();
  private nameToUidMap = new Map<string, string>();
  private channelMap = new Map<string, NavbarInterface>();
  private channelNameToUidMap = new Map<string, string>();
  senderId = '';
  user: UserProfileInterface | null = null;
  currentUserText = false;
  content = '';
  showFloatingMenu = false;
  isHovered = false;
  editView: boolean = false;
  showMenu = false;
  editMenuOpen = false;
  channels = toSignal(inject(NavbarService).channelsObs$);
  parsedMessageTokens: MessageToken[] = [];
  reactionList: any;
  showReactions = false;
  shownEmoji!: string;
  emojiIndex!: number;
  editedText!: string;
  allEmoji: boolean = false;
  isThereEmoji = false;

  constructor(
    private firestore: FirestoreService,
    private router: Router,
    private directMessageService: DirectMessageService,
    private cdr: ChangeDetectorRef,
    private emojiServise: EmojiServiceService,
    private messageService: MessageService,
    private threadDMService: ThreadDirectMessageService,
    public emojiService: EmojiServiceService,
    private authService: AuthService,
    private mentionService: UserMentionService
  ) {}

  ngOnInit(): void {
    this.createLookUpUser();
    this.createLookupChannel();
    this.emojiListChange.emit(this.emojiService.emojiList);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  createLookUpUser() {
    const users = this.firestore.userList();
    this.userMap.clear();
    this.nameToUidMap.clear();
    users.forEach((user) => {
      this.userMap.set(user.uid, user);
      if (user.name) {
        this.nameToUidMap.set(user.name.toLowerCase(), user.uid);
      }
    });
  }

  createLookupChannel() {
    const channels = this.channels();
    this.channelMap.clear();
    this.channelNameToUidMap.clear();
    channels?.forEach((channel) => {
      this.channelMap.set(channel.channelId, channel);
      if (channel.name) {
        this.channelNameToUidMap.set(channel.name.toLowerCase(), channel.channelId);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      if (this.userMap.size === 0) {
        this.createLookUpUser();
      }
      if (this.channelMap.size === 0) {
        this.createLookupChannel();
      }
      this.user = this.userMap.get(this.message.senderId) ?? null;
      const currentUserId = this.firestore.getUserId();
      this.currentUserText = this.message.senderId === currentUserId;
      this.parsedMessageTokens = this.parseMessageMention(this.message.content);
      this.cdr.markForCheck();
    }
  }

  parseMessageMention(content: string): MessageToken[] {
    const mentionRegex = /([@#])([\wäöüÄÖÜß]+(?:\s[\wäöüÄÖÜß]+)*)/g;
    const tokens: MessageToken[] = [];
    let lastIndex = 0;
    const validUsers = this.getValidUserNames();
    const validChannels = this.getValidChannelNames();
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(content)) !== null) {
      this.handleMentionMatch(match, content, tokens, validUsers, validChannels, lastIndex);
      lastIndex = this.getNextLastIndex(match, content, validUsers, validChannels, lastIndex);
    }
    if (lastIndex < content.length) {
      this.createTextType(content, lastIndex, tokens);
    }
    return tokens;
  }

  private getValidUserNames(): string[] {
    // console.log(this.mentionService.filteredUserList());
    return (typeof this.mentionService.filteredUserList === 'function' ? this.mentionService.filteredUserList() : [])
      .map((u: any) => u.name?.trim())
      .filter(Boolean);
  }

  private getValidChannelNames(): string[] {
    // console.log(this.mentionService.getChannelWithUserMemmership())
    return (this.mentionService.getChannelWithUserMemmership?.() || []).map((c: any) => c.name?.trim()).filter(Boolean);
  }

  private findValidMention(
    mentionSymbol: string,
    mentionName: string,
    validUsers: string[],
    validChannels: string[]
  ): { validMention: boolean; foundName: string } {
    if (mentionSymbol === '@') {
      let found = '';
      for (const name of validUsers) {
        if (mentionName.startsWith(name) && name.length > found.length) {
          found = name;
        }
      }
      return { validMention: !!found, foundName: found || mentionName };
    } else if (mentionSymbol === '#') {
      let found = '';
      for (const name of validChannels) {
        if (mentionName.startsWith(name) && name.length > found.length) {
          found = name;
        }
      }
      return { validMention: !!found, foundName: found || mentionName };
    }
    return { validMention: false, foundName: mentionName };
  }

  private handleMentionMatch(
    match: RegExpExecArray,
    content: string,
    tokens: MessageToken[],
    validUsers: string[],
    validChannels: string[],
    lastIndex: number
  ) {
    const index = match.index;
    const mentionSymbol = match[1];
    let mentionName = match[2];
    const { validMention, foundName } = this.findValidMention(mentionSymbol, mentionName, validUsers, validChannels);
    mentionName = foundName;
    if (index > lastIndex) {
      this.createTextType(content, lastIndex, tokens, index);
    }
    if (validMention) {
      this.createMentionType(mentionSymbol, mentionName, tokens);
      const mentionEnd = index + mentionSymbol.length + mentionName.length;
      if (mentionEnd < index + mentionSymbol.length + match[2].length) {
        const extraText = content.slice(mentionEnd, index + mentionSymbol.length + match[2].length);
        if (extraText.trim().length > 0) {
          this.createTextType(extraText, 0, tokens);
        }
      }
    } else {
      this.createTextType(content, index, tokens, match.index + match[0].length);
    }
  }

  private getNextLastIndex(
    match: RegExpExecArray,
    content: string,
    validUsers: string[],
    validChannels: string[],
    prevLastIndex: number
  ): number {
    const index = match.index;
    const mentionSymbol = match[1];
    let mentionName = match[2];
    const { validMention, foundName } = this.findValidMention(mentionSymbol, mentionName, validUsers, validChannels);
    mentionName = foundName;
    if (validMention) {
      const mentionEnd = index + mentionSymbol.length + mentionName.length;
      if (mentionEnd < index + mentionSymbol.length + match[2].length) {
        return index + mentionSymbol.length + match[2].length;
      } else {
        return mentionEnd;
      }
    } else {
      return match.index + match[0].length;
    }
  }

  createTextType(content: string, lastIndex: number, tokens: MessageToken[], index?: number) {
    if (lastIndex < content.length || index! > lastIndex) {
      tokens.push({ type: 'text', value: content.slice(lastIndex, index) });
    }
  }

  createMentionType(symbol: string, name: string, tokens: MessageToken[]) {
    if (symbol === '@') {
      tokens.push({ type: 'mentionUser', userName: name });
    } else if (symbol === '#') {
      tokens.push({ type: 'mentionChannel', channelName: name });
    }
  }

  isTimestamp(value: any): value is Timestamp {
    return value instanceof Timestamp;
  }

  onEmojiClick(emojiName: string) {
    console.log(this.shownEmoji)
    this.emojiServise.toggleEmojiReaction(emojiName, this.message, this.channelId, this.inThreadView, this.messageId);
    this.emojiServise.selectEmoji(emojiName);
  }

  openMoreEmoji(event: Event) {
    if (this.editView) {
      this.emojiService.toggleSmallEmojiEditMenu();
    } else {
      this.emojiService.toggleSmallEmojiMenu();
    }
  }

  openThreadPanel() {
    this.openThread.emit(this.message.id);
  }

  getUser(name: string): string | null {
    return this.nameToUidMap.get(name.toLowerCase()) ?? null;
  }

  async getSelectedDMChannel(username: string): Promise<string | null> {
    const currentUser = this.firestore.getUserId();
    const userId = this.getUser(username);
    if (currentUser && userId) {
      const channelId = await this.directMessageService.getDMChannel(currentUser, userId);
      return channelId;
    }
    return null;
  }

  selectChannel(channelName: string): string | undefined {
    return this.channelNameToUidMap.get(channelName.toLowerCase());
  }

  async onUserMentionClick(userName: string) {
    const dMchannelId = await this.getSelectedDMChannel(userName);
    if (dMchannelId) {
      this.router.navigate(['/directMessages', dMchannelId]);
    } else {
      console.warn(`No DM channel found for @${userName}`);
    }
  }

  onChannelMentionClick(channelName: string) {
    const channelId = this.selectChannel(channelName);
    if (this.channelId) {
      this.router.navigate(['/channel', channelId]);
    } else {
      console.warn(`No DM channel found for @${channelName}`);
    }
  }

  showUsers(users: string[], emojiName: string, index: number) {
    const filteredUserList = this.firestore.userList().filter((user) => users.includes(user.uid));
    this.reactionList = filteredUserList;
    this.showReactions = true;
    this.shownEmoji = emojiName;
    this.emojiIndex = index;
  }

  hideUsers(users: string[]) {
    this.showReactions = false;
  }

  formatNames(userList: any, reactionList: any) {
    let text = '';
    if (userList.length > 1) {
      let name1 = reactionList[0].name == this.firestore.userProfile()?.name ? 'Du' : reactionList[0].name;
      let name2 = reactionList[1]?.name == this.firestore.userProfile()?.name ? 'Du' : reactionList[1]?.name;
      text = name1 + ' und ' + name2 + ' haben reagiert';
    } else if ((userList.length = 1)) {
      let name = reactionList[0].name == this.firestore.userProfile()?.name ? 'Du' : reactionList[0].name;
      let extraText = reactionList[0].name == this.firestore.userProfile()?.name ? ' hast reagiert' : ' hat reagiert ';
      text = name + extraText;
    }
    return text;
  }

  onEditMenuOpened() {
    this.editMenuOpen = true;
    this.showMenu = true;
  }

  onEditMenuClosed() {
    this.editMenuOpen = false;
    this.showMenu = false;
    this.editViewChange.emit(this.editView);
  }

  getCurrentUserId(): string | null {
    return this.authService.firebaseAuth.currentUser?.uid ?? null;
  }

  isCurrentUser() {
    return this.getCurrentUserId() === this.message.senderId;
  }

  openEditView() {
    this.editView = true;
    this.editedText = this.message.content;
    this.editViewChange.emit(this.editView);
    setTimeout(() => {
      this.editInput.nativeElement ? this.editInput.nativeElement.focus() : this.editThreadInput.nativeElement.focus();
    }, 0);
  }

  closeEditView() {
    this.editView = false;
    this.editViewChange.emit(this.editView);
  }

  editText() {
    this.message.content = this.editedText;
    if (this.threadId) {
      this.threadDMService.updateThreadPartial({ content: this.editedText }, this.messageId, this.channelId, this.threadId);
    } else {
      this.messageService.updateMessagePartial({ content: this.editedText }, this.message.id!, this.channelId);
    }
    this.editView = false;
  }

  addEmoji(emoji: any) {
    this.message.content = this.emojiService.addEmojiToContent(emoji, this.message.content);
    this.editedText = this.message.content;
  }

  get isMobileDevice(): boolean {
    return this.isMobileScreen;
  }

  get emojiLimit(): number {
    if (this.inThreadView) {
      return 7;
    }
    return this.isMobileDevice ? 7 : 20;
  }

  get reactionsAll() {
    let limitedReactions: { emojiName: string; users: string[] }[] = [];
    if (this.message.reactions) {
      if (this.allEmoji) {
        const limit = this.emojiLimit;
        if (this.message.reactions && this.message.reactions.length > limit) {
          limitedReactions = this.message.reactions.slice(0, limit);
        } else {
          limitedReactions = this.message.reactions;
        }
      } else {
        limitedReactions = this.message.reactions;
      }
    }
    return limitedReactions;
  }

  get restOfReactions() {
    const limit = this.emojiLimit;
    return this.message.reactions?.slice(limit);
  }

  get hasMoreReactions(): boolean {
    return this.message.reactions ? this.message.reactions.length > this.emojiLimit : false;
  }



  toggleEmojiAmount() {
    this.allEmoji = !this.allEmoji;
    console.log(this.allEmoji);
    console.log(this.message.reactions);
    console.log(this.reactionsAll);
  }
}
