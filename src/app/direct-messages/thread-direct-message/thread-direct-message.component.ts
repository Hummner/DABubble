import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MessageTicketComponent } from '../message-ticket/message-ticket.component';
import { Message } from '../../interfaces/message.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DirectMessageService } from '../../services/direct-message.service';
import { MessageService } from '../../services/message.service';
import { Timestamp } from '@angular/fire/firestore';
import { CommonModule, NgIf } from '@angular/common';
import { ThreadDirectMessageService } from '../../services/thread-direct-message.service';

@Component({
  selector: 'app-thread-direct-message',
  standalone: true,
  imports: [MatIconModule, NgIf, CommonModule, MessageTicketComponent],
  templateUrl: './thread-direct-message.component.html',
  styleUrl: './thread-direct-message.component.scss',
})
export class ThreadDirectMessageComponent implements OnInit {
  @Input() isThreadOpen!: boolean;
  @Output() close = new EventEmitter<void>();
  @Input() message!: Message | null;
  routeSub!: Subscription;
  messageId!: string | null;
  channelId!: string | null;
  threadMessages: Message[] = [];
  private threadMessagesSub!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private directMessageService: DirectMessageService,
    private messageService: MessageService,
    private threadMessageService: ThreadDirectMessageService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.messageId = params.get('messageId');

      this.route.parent?.paramMap.subscribe((parentParams) => {
        this.channelId = parentParams.get('id');
        if (this.channelId && this.messageId) {
          this.fetchMessage(this.channelId, this.messageId);
          this.subscribeToThreadMessages(this.channelId, this.messageId);
        }
      });
    });
  }

  subscribeToThreadMessages(channelId: string, messageId: string) {
    // Subscribe to observable
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
  }

  async fetchMessage(channelId: string, messageId: string) {
    this.message = await this.messageService.getMessageById(
      channelId,
      messageId
    );
    if (this.message) {
      console.log('Loaded message:', this.message);
    } else {
      console.log('Message not found');
    }
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
