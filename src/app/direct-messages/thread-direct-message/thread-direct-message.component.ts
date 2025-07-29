import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MessageTicketComponent } from '../message-ticket/message-ticket.component';
import { Message } from '../../interfaces/message.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DirectMessageService } from '../../services/direct-message.service';
import { MessageService } from '../../services/message.service';
import { Timestamp, serverTimestamp, FieldValue } from '@angular/fire/firestore';
import { CommonModule, NgIf } from '@angular/common';
import { ThreadDirectMessageService } from '../../services/thread-direct-message.service';
import { onSnapshot } from '@angular/fire/firestore';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { FirestoreService } from '../../services/firestore.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-thread-direct-message',
  standalone: true,
  imports: [
    MatIconModule,
    NgIf,
    CommonModule,
    MessageTicketComponent,
    FormsModule,
  ],
  templateUrl: './thread-direct-message.component.html',
  styleUrl: './thread-direct-message.component.scss',
})
export class ThreadDirectMessageComponent implements OnInit {
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private directMessageService: DirectMessageService,
    private messageService: MessageService,
    private threadMessageService: ThreadDirectMessageService,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.messageId = params.get('messageId');
      this.route.parent?.paramMap.subscribe((parentParams) => {
        this.channelId = parentParams.get('id');
        if (this.channelId && this.messageId) {
          this.subscribeToParentMessage(this.channelId, this.messageId);
          this.subscribeToThreadMessages(this.channelId, this.messageId);
        }
      });
    });
    const checkUserInterval = setInterval(() => {
      const currentUser = this.userProfile();
      if (currentUser?.uid) {
        clearInterval(checkUserInterval);
        if (this.channelId) {
          this.subscribeToDM(this.channelId);
          this.senderId = currentUser.uid;
        }
      }
    }, 100);
    if (this.channelId) {
      this.unsubList = this.messageService.subList(this.channelId);
    }

    this.messageService.messageList$.subscribe((msgs) => {
      console.log('Messages received:', msgs);
      this.messages = msgs;
    });
  }


    formatDateLabel(date: Date | Timestamp): string {
    if ('toDate' in date) {
      date = date.toDate();
    }
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    if (isToday) {
      return 'Heute';
    }
    const weekday = date.toLocaleDateString('de-DE', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('de-DE'); // 20/07/2025 → UK format
    return `${weekday}, ${formattedDate}`;
  }

  getMessagesGroupedByDate(): { [date: string]: Message[] } {
    return this.threadMessages.reduce((groups, message) => {
      const createdAt = message.createdAt;
      // Skip if createdAt is missing or a FieldValue (e.g. serverTimestamp)
    if (!this.isValidTimestamp(createdAt)) {
      return groups;
    }
      const dateStr = this.formatDateLabel(createdAt);
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(message);
      return groups;
    }, {} as { [date: string]: Message[] });
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
    }
    this.content = '';
  }

  subscribeToThreadMessages(channelId: string, messageId: string) {
    this.threadMessageService.subThreadList(channelId, messageId);
    this.threadMessagesSub =
      this.threadMessageService.threadMessages$.subscribe((messages) => {
        this.threadMessages = messages;
        console.log('Updated thread messages:', this.threadMessages);
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
        console.log('Live updated parent message:', this.message);
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

  isValidTimestamp(value: any): value is Timestamp {
    return value instanceof Timestamp && typeof value.toDate === 'function';
  }
}
