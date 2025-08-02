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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DirectMessageService } from '../../services/direct-message.service';

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
  @Output() emojiListChange = new EventEmitter<{ name: string; code: string }[]>();

  senderId = '';
  user: UserProfileInterface | null = null;
  currentUserText = false;
  smallEmojiMenu = false;
  showEmojiMenu = false;

  private userMap = new Map<string, UserProfileInterface>();
  private nameToUidMap = new Map<string, string>();

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
    private sanitizer: DomSanitizer,
    private directMessageService: DirectMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Cache users on init to avoid repeated .find calls
    const users = this.firestore.userList();
    this.userMap.clear();
    this.nameToUidMap.clear();
    users.forEach((user) => {
      this.userMap.set(user.uid, user);
      if (user.name) {
        this.nameToUidMap.set(user.name.toLowerCase(), user.uid);
      }
    });

    // Emit emojis once on init
    this.emojiListChange.emit(this.emojiUnicodeMap);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      this.user = this.userMap.get(this.message.senderId) ?? null;
      const currentUserId = this.firestore.getUserId();
      this.currentUserText = this.message.senderId === currentUserId;
      // OnPush needs manual markForCheck on async or input changes
      this.cdr.markForCheck();
    }
  }

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

  formatContent(content: string): SafeHtml {
    const mentionTag = /@([\w]+(?:\s[\w]+)*)/g;
    const replaced = content.replace(mentionTag, (match, username) => {
      const channelId = this.getSelectedChannel(username.trim());
      // Only create link if channelId exists
      if (channelId) {
        return `<a href="/directMessages/${channelId}" class="mention-link">@${username.trim()}</a>`;
      }
      // Otherwise, return plain text to avoid invalid links
      return `@${username.trim()}`;
    });
    // Sanitize safely
    return this.sanitizer.bypassSecurityTrustHtml(replaced);
  }

  getUser(name: string): string | null {
    return this.nameToUidMap.get(name.toLowerCase()) ?? null;
  }

async getSelectedChannel(username: string): Promise<string | null> {
  const currentUser = this.firestore.getUserId();
  const userId = this.getUser(username);
  if (currentUser && userId) {
    const channelId = await this.directMessageService.getDMChannel(currentUser, userId);
    return channelId;
  }
  return null;
}
}
