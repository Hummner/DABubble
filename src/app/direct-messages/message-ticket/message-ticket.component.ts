import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { Message } from '../../interfaces/message.interface';
import { CommonModule } from '@angular/common';
import { Timestamp } from '@angular/fire/firestore';
import { FirestoreService } from '../../services/firestore.service';
import { MessageService } from '../../services/message.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ThreadDirectMessageService } from '../../services/thread-direct-message.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-message-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-ticket.component.html',
  styleUrl: './message-ticket.component.scss',
})
export class MessageTicketComponent implements OnChanges, OnInit {
  @Input() userProfileB!: UserProfileInterface | null;
  @Input() userProfile!: UserProfileInterface | null;
  senderId = '';
  user!: UserProfileInterface | null | undefined;
  currentUserText = false;
  @Input() message!: Message;
  @Input() channelId!: string;
  @Input() threadId?: string;
  @Input() messageId!: string;
  showEmojiMenu = false;
  smallEmojiMenu = false;
  @Input() inThreadView: boolean = false;
  @Output() openThread = new EventEmitter<string | undefined>();

  emojiList = [
    'checked',
    'thumb',
    'nerd',
    'rocket',
    'sad',
    'party',
    'surprised',
    'love',
    'confusion',
    'heart',
    'cool',
    'angry'
  ];

  ngOnChanges(): void {
    const userList = this.firestore.userList;
    this.user = userList.find((user) => user.uid === this.message.senderId);
    const currentUserId = this.firestore.getUserId();
    this.currentUserText = this.message.senderId === currentUserId;
  }

  ngOnInit(): void {}

  constructor(
    private firestore: FirestoreService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute,
    private threadMessageService: ThreadDirectMessageService
  ) {}

  isTimestamp(value: any): value is Timestamp {
    return value instanceof Timestamp;
  }

  onEmojiToggle(emoji: string) {
    if (!this.message?.id) return;
    const threadId = this.message.id;
    const docId = this.messageId ?? this.message.id;
    const reactions = this.message.reactions ? [...this.message.reactions] : [];
    if (reactions.includes(emoji)) {
      reactions.splice(reactions.indexOf(emoji), 1);
    } else {
      reactions.push(emoji);
    }
    this.message.reactions = reactions;
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
    const reactions = this.message.reactions ? [...this.message.reactions] : [];
    const index = reactions.indexOf(emoji);
    if (index !== -1) {
      reactions.splice(index, 1);
      this.message.reactions = reactions;
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
    if (this.smallEmojiMenu === false) {
      this.smallEmojiMenu = true;
    } else {
      this.smallEmojiMenu = false;
    }
    event?.stopPropagation();
  }

  closeMoreEmoji(event: Event) {
    this.smallEmojiMenu = false;
    event?.stopPropagation();
  }

  openThreadPanel() {
    this.openThread.emit(this.message.id);

    console.log(this.message.id);
    this.router.navigate(['threadMessages', this.message.id], {
      relativeTo: this.route,
    });
  }
}
