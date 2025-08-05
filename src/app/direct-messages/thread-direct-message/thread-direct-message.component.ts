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
import { EmojiPickerComponent } from '../../shared/emoji-picker/emoji-picker.component';
import { serverTimestamp } from '@angular/fire/firestore';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatMenuTrigger } from '@angular/material/menu';
import { UserMentionService } from '../../services/user-channel-mention.service';

@Component({
  selector: 'app-thread-direct-message',
  standalone: true,
  imports: [
    MatIconModule,
    NgIf,
    CommonModule,
    MessageTicketComponent,
    FormsModule,
    EmojiPickerComponent,
    ClickStopPropagation,
    MatMenuModule,
  ],
  templateUrl: './thread-direct-message.component.html',
  styleUrl: './thread-direct-message.component.scss',
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
  smallEmojiMenu = false;
  shouldScroll = false;
  private previousThreadMessageCount = 0;
  private isInitialThreadLoad = true;

  @ViewChild('input') input!: ElementRef<HTMLInputElement>;
  @ViewChild('mentionTrigger') mentionMenuTrigger!: MatMenuTrigger;
  @ViewChild('channelTrigger') channelMenuTrigger!: MatMenuTrigger;
  @ViewChild('scrollContainerThread') scrollContainerThread!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private directMessageService: DirectMessageService,
    private messageService: MessageService,
    private threadMessageService: ThreadDirectMessageService,
    private firestoreService: FirestoreService,
    public userMentionService: UserMentionService
  ) {}

  ngOnInit(): void {
    this.handleRouteParams();
    this.waitForUserThenSubscribe();
    if (this.channelId) {
      this.unsubList = this.messageService.subList(this.channelId);
    }
    this.messageService.messageList$.subscribe((msgs) => {
      this.messages = msgs;
    });
    this.shouldScroll = true;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.threadMessages.length) {
      // Use a longer delay to ensure DOM is fully updated with new message
      setTimeout(() => {
        this.scrollToBottomInstantly();
      }, 100);
      this.shouldScroll = false;
    }
  }

  scrollToBottomInstantly() {
    if (this.scrollContainerThread?.nativeElement) {
      const el = this.scrollContainerThread.nativeElement;
      el.scrollTop = el.scrollHeight;
      console.log(el.scrollHeight);
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
          // Reset state for new thread
          this.previousThreadMessageCount = 0;
          this.isInitialThreadLoad = true;
          this.shouldScroll = true;
        }
      });
    });
  }

  waitForUserThenSubscribe() {
    const currentUser = this.userProfile();
    if (currentUser?.uid) {
      if (this.channelId) {
        this.subscribeToDM(this.channelId);
        this.senderId = currentUser.uid;
      }
      return;
    }
  }

  groupMessagesByDate(): { [date: string]: Message[] } {
    return this.messageService.getMessagesGroupedByDate(this.threadMessages);
  }

  subscribeToDM(id: string) {
    this.unsubSingleDM = this.directMessageService.subDMChannel(id, (data) => {
      const users = data['users'] as string[];
      const currentId = this.userProfile()?.uid;
      const otherUserId = users.find((uid) => uid !== currentId);
      if (otherUserId) {
        this.getOtherUserProfile(otherUserId);
      }
    });
  }

  getOtherUserProfile(otherUserId: string) {
    this.unsubUserList = this.firestoreService.subUserList((users) => {
      const otherUser = users.find((user) => user.uid === otherUserId);
      if (otherUser) {
        this.userProfileB.set(otherUser);
      }
    });
  }

  addThreadMessage() {
    const threadMessage = {
      createdAt: serverTimestamp(),
      senderId: this.senderId,
      content: this.content,
      hasThread: false,
      threadCount: 0,
    };
    if (this.channelId && this.message?.id) {
      this.threadMessageService.addThreadMessage(
        threadMessage,
        this.channelId,
        this.message?.id
      );
      this.updateParentMessageWithThreadInfo(this.message);
      this.shouldScroll = true; // Keep this for manual message addition
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
    this.threadMessageService.subThreadList(channelId, messageId);
    this.threadMessagesSub =
      this.threadMessageService.threadMessages$.subscribe((messages) => {
        // Only scroll if:
        // 1. It's the initial load (first time getting thread messages)
        // 2. New messages were added (message count increased)
        if (
          this.isInitialThreadLoad ||
          messages.length > this.previousThreadMessageCount
        ) {
          this.shouldScroll = true;
        }

        this.threadMessages = messages;
        this.previousThreadMessageCount = messages.length;
        this.isInitialThreadLoad = false;
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
    const docRef = this.messageService.getSingleMessageRef(
      channelId,
      messageId
    );
    this.parentMessageUnsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        this.message = this.messageService.setMessageObject(
          docSnap.data(),
          docSnap.id
        );
      }
    });
  }

  closeThread() {
    this.close.emit();
    this.router.navigate([
      '/directMessages',
      this.route.snapshot.parent?.paramMap.get('id'),
    ]);
  }

  toggleSmallEmojiMenu() {
    if (this.smallEmojiMenu == false) {
      this.smallEmojiMenu = true;
    } else {
      this.smallEmojiMenu = false;
    }
  }

  closeEmojiBox() {
    this.smallEmojiMenu = false;
  }

  addEmoji(emoji: any) {
    if (emoji) {
      this.content += emoji;
    }
  }

  tagInputStart() {
    this.content = this.userMentionService.tagInputStart(
      this.content,
      this.input
    );
  }
  tagInputChannelStart() {
    this.content = this.userMentionService.tagChannelInputStart(
      this.content,
      this.input
    );
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
    this.userMentionService.onInputChange(
      this.content,
      this.mentionMenuTrigger,
      this.channelMenuTrigger,
      this.input
    );
  }
}
