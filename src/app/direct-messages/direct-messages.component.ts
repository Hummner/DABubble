import {
  Component,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
  AfterViewChecked,
  NgModule,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
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
import { RouterOutlet } from '@angular/router';
import { serverTimestamp } from '@angular/fire/firestore';
import { ClickStopPropagation } from '../click-stop-propagation.directive';
import { EmojiPickerComponent } from '../shared/emoji-picker/emoji-picker.component';
import { MatMenuTrigger } from '@angular/material/menu';
import { UserMentionService } from '../services/user-channel-mention.service';
import { NavbarService } from '../services/navbar.service';
import { toSignal } from '@angular/core/rxjs-interop';
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
    RouterOutlet,
    ClickStopPropagation,
    EmojiPickerComponent,
    MatMenuTrigger,
  ],
  templateUrl: './direct-messages.component.html',
  styleUrls: ['./direct-messages.component.scss'],
})
export class DirectMessagesComponent
  implements OnInit, OnDestroy, AfterViewChecked
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
  messageListSub!: Subscription;
  routerEventsSub!: Subscription;
  unsubList?: () => void;
  content = '';
  senderId = '';
  hasThread = false;
  threadCount = 0;
  shouldScroll = false;
  messages: Message[] = [];
  public Object = Object;
  isThreadOpen = false;
  smallEmojiMenu = false;
  parentEmojiList: any;
  @ViewChild('input') input!: ElementRef<HTMLInputElement>;
  @ViewChild('mentionTrigger') mentionMenuTrigger!: MatMenuTrigger;
  @ViewChild('channelTrigger') channelMenuTrigger!: MatMenuTrigger;
  channels = toSignal(inject(NavbarService).channelsObs$);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private directMessageService: DirectMessageService,
    private firestoreService: FirestoreService,
    private messageService: MessageService,
    public userMentionService: UserMentionService,
    public navbarService: NavbarService
  ) {}

  updateEmojiList(emojis: any) {
    this.parentEmojiList = emojis;
  }

  subThreadRoute() {
    this.routerEventsSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isThreadOpen = this.router.url.includes('threadMessages');
      }
    });
  }

  ngOnInit(): void {
    this.subThreadRoute();
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.channelId = id;
        this.waitForUserThenSubscribe(id);
        this.unsubList = this.messageService.subList(this.channelId);
      }
    });
    this.messageListSub = this.messageService.messageList$.subscribe((msgs) => {
      this.messages = msgs;
      this.shouldScroll = true;
    });
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      // Use requestAnimationFrame for better performance and to avoid blocking
      requestAnimationFrame(() => {
        this.scrollToBottomInstantly();
      });
      this.shouldScroll = false;
    }
  }

  scrollToBottomInstantly() {
    if (this.scrollContainer?.nativeElement) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
      console.log(el.scrollHeight);
    }
  }

  waitForUserThenSubscribe(id: string) {
    const checkUserInterval = setInterval(() => {
      const currentUser = this.userProfile();
      if (currentUser?.uid) {
        clearInterval(checkUserInterval);
        this.subscribeToDM(id);
        this.senderId = currentUser.uid;
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.unsubSingleDM?.();
    this.routeSub?.unsubscribe();
    this.messageListSub?.unsubscribe();
    this.routerEventsSub?.unsubscribe();
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

  addMessage() {
    const message: Message = {
      createdAt: serverTimestamp(),
      senderId: this.senderId,
      content: this.content,
      hasThread: this.hasThread,
      threadCount: this.threadCount,
    };
    this.messageService.addMessage(message, this.channelId);
    this.content = '';
  }

  groupMessagesByDate(): { [date: string]: Message[] } {
    return this.messageService.getMessagesGroupedByDate(this.messages);
  }

  trackByMessageId(index: number, message: Message) {
    return message.id || index;
  }

  openThread(messageId: string | undefined) {
    if (!messageId) {
      console.warn('No message id');
      return;
    }
    this.isThreadOpen = true;
    this.router.navigate([
      'directMessages',
      this.channelId,
      'threadMessages',
      messageId,
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
    console.log(emoji.name, 'added');
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
