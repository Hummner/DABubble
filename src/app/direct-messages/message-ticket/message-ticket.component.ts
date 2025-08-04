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
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { Message } from '../../interfaces/message.interface';
import { CommonModule } from '@angular/common';
import { Timestamp } from '@angular/fire/firestore';
import { FirestoreService } from '../../services/firestore.service';
import { MessageService } from '../../services/message.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ThreadDirectMessageService } from '../../services/thread-direct-message.service';
import { EmojiPickerComponent } from '../../shared/emoji-picker/emoji-picker.component';
import { DirectMessageService } from '../../services/direct-message.service';
import { NavbarInterface } from '../../interfaces/navbar.interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavbarService } from '../../services/navbar.service';

type MessageToken =
  | { type: 'text'; value: string }
  | { type: 'mentionUser'; userName: string }
  | { type: 'mentionChannel'; channelName: string };

@Component({
  selector: 'app-message-ticket',
  standalone: true,
  imports: [CommonModule, EmojiPickerComponent],
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

  @Output() openThread = new EventEmitter<string | undefined>();
  @Output() emojiListChange = new EventEmitter<
    { name: string; code: string }[]
  >();

  senderId = '';
  user: UserProfileInterface | null = null;
  currentUserText = false;
  smallEmojiMenu = false;
  showEmojiMenu = false;

  private userMap = new Map<string, UserProfileInterface>();
  private nameToUidMap = new Map<string, string>();
  private channelMap = new Map<string, NavbarInterface>();
  private channelNameToUidMap = new Map<string, string>();
  channels = toSignal(inject(NavbarService).channelsObs$);

  parsedMessageTokens: MessageToken[] = [];
  // parsedMessageTokensChannelMention: MessageToken[] = [];

  emojiUnicodeMap = [
    { name: 'checked', code: '✅' },
    { name: 'thumb', code: '👍' },
    { name: 'nerd', code: '🤓' },
    { name: 'rocket', code: '🚀' },
    { name: 'sad', code: '😢' },
    { name: 'party', code: '🥳' },
    { name: 'surprised', code: '😲' },
    { name: 'love', code: '😍' },
    { name: 'confusion', code: '😕' },
    { name: 'heart', code: '❤️' },
    { name: 'cool', code: '😎' },
    { name: 'angry', code: '😠' },
  ];

  constructor(
    private firestore: FirestoreService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private threadMessageService: ThreadDirectMessageService,
    private directMessageService: DirectMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.createLookUpUser();
    this.createLookupChannel();
    this.emojiListChange.emit(this.emojiUnicodeMap);
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
        this.channelNameToUidMap.set(
          channel.name.toLowerCase(),
          channel.channelId
        );
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
    const mentionRegex = /([@#])([\w]+(?:\s[\w]+)*)/g;
    const tokens: MessageToken[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(content)) !== null) {
      const index = match.index;
      const mentionSymbol = match[1];
      const mentionName = match[2];

      if (index > lastIndex) {
        tokens.push({ type: 'text', value: content.slice(lastIndex, index) });
      }

      if (mentionSymbol === '@') {
        tokens.push({ type: 'mentionUser', userName: mentionName });
      } else if (mentionSymbol === '#') {
        tokens.push({ type: 'mentionChannel', channelName: mentionName });
      }
      lastIndex = mentionRegex.lastIndex;
    }
    if (lastIndex < content.length) {
      tokens.push({ type: 'text', value: content.slice(lastIndex) });
    }

    return tokens;
  }

  // createTextType(
  //   content: string,
  //   lastIndex: number,
  //   index: number,
  //   tokens: MessageToken[]
  // ) {
  //   if (lastIndex < content.length || index > lastIndex) {
  //     tokens.push({ type: 'text', value: content.slice(lastIndex, index) });
  //   }
  // }

  isTimestamp(value: any): value is Timestamp {
    return value instanceof Timestamp;
  }

  onEmojiToggle(emoji: string) {
    if (!this.message?.id) return;
    const threadId = this.message.id;
    const docId = this.messageId ?? this.message.id;
    const reactionsSet = new Set(this.message.reactions ?? []);
    if (reactionsSet.has(emoji)) {
      reactionsSet.delete(emoji);
    } else {
      reactionsSet.add(emoji);
    }
    this.message.reactions = Array.from(reactionsSet);

    if (this.inThreadView && docId && threadId) {
      this.threadMessageService.updateThreadMessage(
        this.message,
        docId,
        this.channelId,
        threadId
      );
    } else {
      this.messageService.updateMessage(this.message, docId, this.channelId);
    }
  }

  onEmojiRemove(emoji: string) {
    if (!this.message?.id) return;
    const threadId = this.message.id;
    const docId = this.messageId ?? this.message.id;
    const reactionsSet = new Set(this.message.reactions ?? []);
    if (reactionsSet.has(emoji)) {
      reactionsSet.delete(emoji);
      this.message.reactions = Array.from(reactionsSet);
      if (this.inThreadView && docId && threadId) {
        this.threadMessageService.updateThreadMessage(
          this.message,
          docId,
          this.channelId,
          threadId
        );
      } else {
        this.messageService.updateMessage(this.message, docId, this.channelId);
      }
    }
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
      const channelId = await this.directMessageService.getDMChannel(
        currentUser,
        userId
      );
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
      console.log(channelId);
      this.router.navigate(['/channel', channelId]);
    } else {
      console.warn(`No DM channel found for @${channelName}`);
    }
  }
}
