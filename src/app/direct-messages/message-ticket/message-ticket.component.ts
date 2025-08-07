import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { Message } from '../../interfaces/message.interface';
import { CommonModule } from '@angular/common';
import { Timestamp } from '@angular/fire/firestore';
import { FirestoreService } from '../../services/firestore.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DirectMessageService } from '../../services/direct-message.service';
import { NavbarInterface } from '../../interfaces/navbar.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavbarService } from '../../services/navbar.service';
import { EmojiServiceService } from '../../services/emoji.service';

type MessageToken =
  | { type: 'text'; value: string }
  | { type: 'mentionUser'; userName: string }
  | { type: 'mentionChannel'; channelName: string };

@Component({
  selector: 'app-message-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-ticket.component.html',
  styleUrl: './message-ticket.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageTicketComponent implements OnChanges, OnInit {
  @Input() userProfileB!: UserProfileInterface | null;
  @Input() userProfile!: UserProfileInterface | null;
  @Input() message!: Message;
  @Input() channelId!: string;
  @Input() threadId?: string;
  @Input() messageId!: string;
  @Input() inThreadView: boolean = false;
  @Input() isParentInThread: boolean = false; // New input to indicate parent message in thread context

  @Output() openThread = new EventEmitter<string | undefined>();
  @Output() emojiListChange = new EventEmitter<{ name: string; code: string }[]>();

  senderId = '';
  user: UserProfileInterface | null = null;
  currentUserText = false;
  smallEmojiMenu = false;
  showEmojiMenu = false;
  // @Input() emojiChanged = false;

  private userMap = new Map<string, UserProfileInterface>();
  private nameToUidMap = new Map<string, string>();
  private channelMap = new Map<string, NavbarInterface>();
  private channelNameToUidMap = new Map<string, string>();
  channels = toSignal(inject(NavbarService).channelsObs$);

  parsedMessageTokens: MessageToken[] = [];

  emojiList = this.emojiServise.emojiList;
  reactionList: any;
  showReactions = false;
  shownEmoji!: string;
  emojiIndex!: number;

  constructor(
    private firestore: FirestoreService,
    private router: Router,
    private route: ActivatedRoute,
    private directMessageService: DirectMessageService,
    private cdr: ChangeDetectorRef,
    private emojiServise: EmojiServiceService
  ) {}

  ngOnInit(): void {
    this.createLookUpUser();
    this.createLookupChannel();
    this.emojiListChange.emit(this.emojiList);
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
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(content)) !== null) {
      const index = match.index;
      const mentionSymbol = match[1];
      const mentionName = match[2];
      this.createTextType(content, lastIndex, tokens, index);
      this.createMentionType(mentionSymbol, mentionName, tokens);
      lastIndex = mentionRegex.lastIndex;
    }
    this.createTextType(content, lastIndex, tokens);
    return tokens;
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
    this.emojiServise.toggleEmojiReaction(emojiName, this.message, this.channelId, this.inThreadView, this.messageId);
    this.emojiServise.selectEmoji(emojiName);
  }

  get sortedEmojis() {
    return this.emojiServise.sortedEmojis;
  }

  openMoreEmoji(event: Event) {
    this.smallEmojiMenu = !this.smallEmojiMenu;
    event?.stopPropagation();
  }

  closeMoreEmoji(event: Event) {
    this.smallEmojiMenu = false;
    event?.stopPropagation();
  }

  openThreadPanel() {
    this.openThread.emit(this.message.id);
    this.router.navigate(['threadMessages', this.message.id], {
      relativeTo: this.route,
    });
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
}
