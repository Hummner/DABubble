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
import { NgIf } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { DirectMessageService } from '../services/direct-message.service';
import { FirestoreService } from '../services/firestore.service';
import { UserProfileInterface } from '../interfaces/user-profile.interface';
import { MatCardModule } from '@angular/material/card';
import { UserCardComponent } from './user-card/user-card.component';
import { FormsModule } from '@angular/forms';
import { Message } from '../interfaces/message.interface';
import { MessageService } from '../services/message.service';
import { serverTimestamp } from '@angular/fire/firestore';
import { MessageTicketComponent } from './message-ticket/message-ticket.component';
import { Timestamp } from 'firebase/firestore';

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

  message: Message = {
    id: '2',
    createdAt: Timestamp.fromDate(new Date()),
    senderId: 'fdsfsfsd',
    content: 'this is my message',
    reactions: ['thumb', 'heart'],
  };

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
      } else {
        console.warn('No channel ID in route.');
      }

      this.unsubList = this.messageService.subList(this.channelId);
      this.shouldScroll = true;
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

  get userB() {
    return this.userProfileB();
  }

  getOtherUserProfile(otherUserId: string) {
    this.unsubUserList = this.firestoreService.subUserList((users) => {
      const otherUser = users.find((user) => user.uid === otherUserId);
      if (otherUser) {
        this.userProfileB.set(otherUser);
        // this.userProfileB = otherUser;
        // console.log('Other user profile:', this.userProfileB);
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubSingleDM?.();
    this.routeSub?.unsubscribe();
    this.unsubUserList?.();
    this.unsubList;
  }

  getMsgList() {
    return this.messageService.messageList;
  }

  addMessage() {
    let message: Message = {
      id: '',
      createdAt: serverTimestamp(),
      senderId: this.senderId,
      content: this.content,
    };
    this.messageService.addMessage(message, this.channelId);
    this.content = '';
  }
  // trackByMsgId(index: number, msg: Message): string {
  //   return msg.id ?? index.toString(); // fallback in case id is missing
  // }

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
}
