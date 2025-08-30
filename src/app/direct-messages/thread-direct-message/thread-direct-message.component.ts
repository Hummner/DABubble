import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  signal,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MessageTicketComponent } from '../message-ticket/message-ticket.component';
import { Message } from '../../interfaces/message.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DirectMessageService } from '../../services/direct-message.service';
import { MessageService } from '../../services/message.service';
import { CommonModule, NgIf } from '@angular/common';
import { ThreadDirectMessageService } from '../../services/thread-direct-message.service';
import { onSnapshot } from '@angular/fire/firestore';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { FirestoreService } from '../../services/firestore.service';
import { FormsModule } from '@angular/forms';
import { ClickStopPropagation } from '../../click-stop-propagation.directive';
import { serverTimestamp } from '@angular/fire/firestore';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatMenuTrigger } from '@angular/material/menu';
import { UserMentionService } from '../../services/user-channel-mention.service';
import { EmojiServiceService } from '../../services/emoji.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-thread-direct-message',
  standalone: true,
  imports: [
    MatIconModule,
    NgIf,
    CommonModule,
    MessageTicketComponent,
    FormsModule,
    ClickStopPropagation,
    MatMenuModule,
    MatProgressSpinner,
  ],
  templateUrl: './thread-direct-message.component.html',
  styleUrl: './thread-direct-message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreadDirectMessageComponent implements OnInit, AfterViewChecked {
  @Input() isThreadOpen!: boolean;
  @Output() close = new EventEmitter<void>();
  @Input() message: Message | null = null;
  routeSub!: Subscription;
  messageId!: string | null;
  channelId!: string | null;
  threadId!: string | null;
  threadMessages: Message[] = [];
  private threadMessagesSub!: Subscription;
  private parentMessageUnsub: (() => void) | null = null;
  messages: Message[] = [];
  public Object = Object;
  unsubSingleDM?: () => void;
  unsubUserList?: () => void;
  unsubList?: () => void;
  userProfile = this.firestoreService.userProfile;
  userProfileB = signal<UserProfileInterface | null>(null);
  content = '';
  senderId = '';
  shouldScroll = false;
  private previousThreadMessageCount = 0;
  private isInitialThreadLoad = true;
  private previousMessageCount = 0;
  private isInitialLoad = true;

  @ViewChild('threadInput') threadInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('mentionTrigger') mentionMenuTrigger!: MatMenuTrigger;
  @ViewChild('channelTrigger') channelMenuTrigger!: MatMenuTrigger;
  @ViewChild('scrollContainerThread') scrollContainerThread!: ElementRef;
  parentEditView = false;
  isSending = signal(false);
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private directMessageService: DirectMessageService,
    private messageService: MessageService,
    private threadMessageService: ThreadDirectMessageService,
    private firestoreService: FirestoreService,
    public userMentionService: UserMentionService,
    public emojiService: EmojiServiceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.handleRouteParams();
    if (this.channelId) {
      this.unsubList = this.messageService.subList(this.channelId);
    }
    this.messageService.messageList$.subscribe((msgs) => {
      this.messages = msgs;
      this.isInitialLoad = false;
      setTimeout(() => {
        this.loading = false;
        this.cdr.markForCheck();
        this.scrollToBottomInstantly();
      }, 1000);
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.threadMessages.length) {
      requestAnimationFrame(() => {
        this.scrollToBottomInstantly();
        this.shouldScroll = false;
        if (this.threadInput && this.threadInput.nativeElement) this.threadInput.nativeElement.focus();
      });
    }
  }

  scrollToBottomInstantly() {
    if (this.scrollContainerThread?.nativeElement) {
      const el = this.scrollContainerThread.nativeElement;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    } else {
      console.log('ScrollContainer not available');
    }
  }

  handleRouteParams() {
    this.route.paramMap.subscribe((params) => {
      this.messageId = params.get('messageId');
      this.route.parent?.paramMap.subscribe((parentParams) => {
        this.channelId = parentParams.get('id');
        if (this.channelId && this.messageId) {
          this.subscribeToParentMessage(this.channelId, this.messageId);
          this.subscribeToThreadMessages(this.channelId, this.messageId);
        }
        this.waitForUserThenSubscribe();
      });
    });
  }

  waitForUserThenSubscribe() {
    const currentUser = this.userProfile();
    if (currentUser?.uid) {
      this.senderId = currentUser.uid;
      if (this.channelId) {
        this.subscribeToDM(this.channelId);
        this.previousThreadMessageCount = 0;
        this.isInitialLoad = true;
      }
    } else {
      setTimeout(() => {
        if (!this.senderId) {
          this.waitForUserThenSubscribe();
        }
      }, 100);
    }
  }

  trackByMessageId(index: number, message: Message) {
    return message.id || index;
  }

  groupMessagesByDate(): { [date: string]: Message[] } {
    return this.messageService.getMessagesGroupedByDate(this.threadMessages);
  }

  subscribeToDM(id: string) {
    const currentUserId = this.userProfile()?.uid;
    if (!currentUserId) return;
    this.unsubSingleDM?.();
    this.unsubSingleDM = this.directMessageService.subDirectMessageChannel(id, currentUserId);
    this.userProfileB.set(this.directMessageService.secondUserProfile());
  }

  addThreadMessage() {
    const currentUserId = this.senderId || this.userProfile()?.uid;
    if (!currentUserId) {
      console.error('Cannot send thread message: No user ID available');
      return;
    }
    const threadMessage = {
      createdAt: serverTimestamp(),
      senderId: currentUserId,
      content: this.content,
      hasThread: false,
      threadCount: 0,
    };
    if (this.channelId && this.message?.id) {
      this.threadMessageService.addThreadMessage(threadMessage, this.channelId, this.message?.id);
      this.updateParentMessageWithThreadInfo(this.message);
      this.shouldScroll = true;
    }
    this.content = '';
  }

  updateParentMessageWithThreadInfo(message: Message) {
    let hasThread = message.hasThread;
    let threadCount = message.threadCount;
    hasThread = true;
    threadCount++;
    this.messageService.updateMessagePartial(
      {
        hasThread: true,
        threadCount: (this.message?.threadCount || 0) + 1,
      },
      message.id!,
      this.channelId!
    );
  }

  subscribeToThreadMessages(channelId: string, messageId: string) {
    if (this.threadMessagesSub) {
      this.threadMessagesSub.unsubscribe();
    }
    this.threadMessageService.subThreadList(channelId, messageId);
    this.threadMessagesSub = this.threadMessageService.threadMessages$.subscribe((messages) => {
      console.log('[ThreadMessages] Received from Firestore:', messages);
      if (this.isInitialThreadLoad || messages.length > this.previousThreadMessageCount) {
        const wasEmpty = this.messages.length === 0;
        const hadNewMessage = messages.length > this.previousThreadMessageCount;
        this.threadMessages = messages;
        if (wasEmpty || (hadNewMessage && this.previousThreadMessageCount > 0)) {
          this.shouldScroll = true;
        }
      } else {
        this.threadMessages = messages;
      }
      this.previousThreadMessageCount = messages.length;
      this.isInitialThreadLoad = false;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    if (this.threadMessagesSub) {
      this.threadMessagesSub.unsubscribe();
    }
    if (this.parentMessageUnsub) {
      this.parentMessageUnsub();
    }
  }

  subscribeToParentMessage(channelId: string, messageId: string) {
    const docRef = this.messageService.getSingleMessageRef(channelId, messageId);
    this.parentMessageUnsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        this.message = this.messageService.setMessageObject(docSnap.data(), docSnap.id);
      }
    });
  }

  closeThread() {
    this.close.emit();
    this.router.navigate(['/directMessages', this.route.snapshot.parent?.paramMap.get('id')]);
  }

  addEmoji(emoji: any) {
    this.content = this.emojiService.addEmojiToContent(emoji, this.content);
  }

  onEmojiClick(emoji: any) {
    this.addEmoji(emoji.code);
    this.emojiService.selectEmoji(emoji.name);
  }

  openMoreEmoji(event: Event) {
    this.emojiService.toggleSmallEmojiThreadInputMenu();
  }

  tagInputStart() {
    this.content = this.userMentionService.tagInputStart(this.content, this.threadInput);
  }

  tagInputChannelStart() {
    this.content = this.userMentionService.tagChannelInputStart(this.content, this.threadInput);
  }

  updateFilteredUserList() {
    this.userMentionService.updateFilteredUserList(this.content);
  }

  updateFilteredChannelList() {
    this.userMentionService.updateFilteredChannelList(this.content);
  }

  takeUser(name: string) {
    this.content = this.userMentionService.takeUser(name, this.content);
  }

  takeChannel(name: string) {
    this.content = this.userMentionService.takeChannel(name, this.content);
  }

  onInputChange(event: Event) {
    this.userMentionService.onInputChange(this.content, this.mentionMenuTrigger, this.channelMenuTrigger, this.threadInput);
  }

  onEditViewChange(isOpen: boolean) {
    this.parentEditView = isOpen;
  }
}
