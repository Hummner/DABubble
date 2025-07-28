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
  showEmojiMenu = false;
  smallEmojiMenu = false;
  @Input() inThreadView: boolean = false;
  @Output() openThread = new EventEmitter<string | undefined>();

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

  addOrRemoveEmoji(emoji: string, msgId: any, channelId: string) {
    if (!msgId) {
      console.error('Message Id not available');
      return;
    }
    const reactions = this.message.reactions ? [...this.message.reactions] : [];
    if (!reactions.includes(emoji)) {
      reactions.push(emoji);
    } else if (reactions.includes(emoji)) {
      const indexToDelete = reactions.indexOf(emoji);
      reactions.splice(indexToDelete, 1);
    }
    this.message.reactions = reactions;
    this.messageService.updateMessage(this.message, msgId, channelId);
  }

  removeEmoji(emoji: string, msgId: any, channelId: string) {
    const reactions = this.message.reactions ? [...this.message.reactions] : [];
    const indexToDelete = reactions.indexOf(emoji);
    reactions.splice(indexToDelete, 1);
    this.message.reactions = reactions;
    this.messageService.updateMessage(this.message, msgId, channelId);
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
