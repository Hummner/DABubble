import {
  Component,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
  AfterViewChecked,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgIf, NgFor } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { DirectMessageService } from '../services/direct-message.service';
import { FirestoreService } from '../services/firestore.service';
import { MessageService } from '../services/message.service';
import { UserProfileInterface } from '../interfaces/user-profile.interface';
import { Message } from '../interfaces/message.interface';
import { UserCardComponent } from './user-card/user-card.component';
import { MessageTicketComponent } from './message-ticket/message-ticket.component';
import { serverTimestamp, Timestamp } from '@angular/fire/firestore';
import { FieldValue } from 'firebase/firestore';

@Component({
  selector: 'app-direct-messages',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatIconModule,
    MatMenuModule,
    NgIf,
    MatCardModule,
    UserCardComponent,
    FormsModule,
    MessageTicketComponent,
    NgFor,
  ],
  templateUrl: './direct-messages.component.html',
  styleUrl: './direct-messages.component.scss',
})
export class DirectMessagesComponent
  implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked
{
  channelId!: string;
  userProfile = this.firestoreService.userProfile;
  userProfileB = signal<UserProfileInterface | null>(null);

  profileOpen = false;
  backdropVisible = false;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  unsubSingleDM?: () => void;
  unsubUserList?: () => void;
  routeSub!: Subscription;
  unsubList?: () => void;
  content = '';
  senderId = '';
  shouldScroll = false;

  messages: Message[] = [];
  public Object = Object;

  constructor(
    private route: ActivatedRoute,
    private directMessageService: DirectMessageService,
    private firestoreService: FirestoreService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.channelId = id;

        const checkUserInterval = setInterval(() => {
          const currentUser = this.userProfile();
          if (currentUser?.uid) {
            clearInterval(checkUserInterval);
            this.subscribeToDM(id);
            this.senderId = currentUser.uid;
          }
        }, 100);

        this.unsubList = this.messageService.subList(this.channelId);
        this.messageService.messageList$.subscribe((msgs) => {
          console.log('Messages received:', msgs);
          this.messages = msgs;
          this.shouldScroll = true;
        });
      }
    });
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  ngAfterViewChecked() {
    setTimeout(() => {
      if (this.shouldScroll) {
        this.scrollToBottom();
        this.shouldScroll = false;
      }
    }, 500);
  }

  ngOnDestroy(): void {
    this.unsubSingleDM?.();
    this.routeSub?.unsubscribe();
    this.unsubUserList?.();
    this.unsubList?.();
  }

  get userB() {
    return this.userProfileB();
  }

  openProfileView() {
    this.profileOpen = true;
    this.backdropVisible = true;
  }

  closeProfileCard() {
    this.profileOpen = false;
    this.backdropVisible = false;
  }

  subscribeToDM(id: string) {
    this.unsubSingleDM = this.directMessageService.subSingleDM(id, (data) => {
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

  addMessage() {
    const message: Message = {
      createdAt: serverTimestamp(),
      senderId: this.senderId,
      content: this.content,
    };
    this.messageService.addMessage(message, this.channelId);
    this.content = '';
  }

  scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTo({
          top: this.scrollContainer.nativeElement.scrollHeight,
          behavior: 'smooth',
        });
      }
    } catch (err) {
      console.error('Failed to scroll:', err);
    }
  }

  getMsgList() {
    return this.messages;
  }

  //Firebase creates Timestamp - realdate/time value, it has a method ".toDate()"
  //which converts it to native JavaScript Date Object
  //when we fetch a message, createdAt filed value will be a Timestamp
  //FieldValue it not a real date/time value, it is a placeholder used ONLY when writing to Firestore
  //serverTimestamp() returns a FieldValue
  //  - and Firestore replace this with actual Timestamp when the document is written on the server
  //we chack first if -date- has a "toDate method", when yes, then it converts to JavaScript date
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
    return this.messages.reduce((groups, message) => {
      const createdAt = message.createdAt;
      // Skip if createdAt is missing or a FieldValue (e.g. serverTimestamp)
      if (!createdAt || createdAt instanceof FieldValue) {
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
  trackByMessageId(index: number, message: Message) {
    return message.id || index;
  }
}
