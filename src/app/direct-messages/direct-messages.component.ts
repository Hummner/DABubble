import {
  Component,
  signal,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  inject,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
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
import { Message } from '../interfaces/message.interface';
import { UserCardComponent } from './user-card/user-card.component';
import { MessageTicketComponent } from './message-ticket/message-ticket.component';
import { RouterOutlet } from '@angular/router';
import { serverTimestamp } from '@angular/fire/firestore';
import { ClickStopPropagation } from '../click-stop-propagation.directive';
import { MatMenuTrigger } from '@angular/material/menu';
import { UserMentionService } from '../services/user-channel-mention.service';
import { NavbarService } from '../services/navbar.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { EmojiServiceService } from '../services/emoji.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

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
    MatMenuTrigger,
    MatProgressSpinner,
  ],
  templateUrl: './direct-messages.component.html',
  styleUrls: ['./direct-messages.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectMessagesComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('input') input!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('mentionTrigger') mentionMenuTrigger!: MatMenuTrigger;
  @ViewChild('channelTrigger') channelMenuTrigger!: MatMenuTrigger;
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  unsubSingleDM?: () => void;
  unsubUserList?: () => void;
  unsubList?: () => void;
  private previousMessageCount = 0;
  private isInitialLoad = true;
  public Object = Object;
  channelId!: string;
  userProfile = this.firestoreService.userProfile;
  profileOpen = false;
  backdropVisible = false;
  routeSub!: Subscription;
  messageListSub!: Subscription;
  routerEventsSub!: Subscription;
  content = '';
  senderId = '';
  hasThread = false;
  threadCount = 0;
  shouldScroll = false;
  messages: Message[] = [];
  isThreadOpen = false;
  parentEmojiList: any;
  channels = toSignal(inject(NavbarService).channelsObs$);
  parentEditView = false;
  isSending = signal(false);
  windowWidth = window.innerWidth;
  loading = false;
  private didFocusInput = false; 

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private directMessageService: DirectMessageService,
    private firestoreService: FirestoreService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    public userMentionService: UserMentionService,
    public navbarService: NavbarService,
    public emojiService: EmojiServiceService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.subThreadRoute();
    this.subscribeToDmChannel();
    this.subscribeToMsgList();
    setTimeout(() => {
      const url = this.router.url;
      if (url.includes('threadMessages') && !this.isThreadOpen) {
        const channelId = this.route.snapshot.paramMap.get('id');
        if (channelId) {
          this.router.navigate(['/directMessages', channelId]);
        }
      }
    }, 0);
    this.checkWindowWidth();
  }

  checkWindowWidth() {
    this.windowWidth = window.innerWidth;
  }

  get isMobileScreen(): boolean {
    return this.windowWidth <= 768;
  }

  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number) {
    this.windowWidth = width;
    this.cdr.markForCheck();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll && this.messages.length && this.scrollContainer?.nativeElement) {
      requestAnimationFrame(() => {
        this.scrollToBottomInstantly();
        this.shouldScroll = false;
      });
    }
    if (!this.isThreadOpen && this.input?.nativeElement && !this.parentEditView && !this.didFocusInput) {
      this.input.nativeElement.focus();
      this.didFocusInput = true;
    }
  }

  ngOnDestroy(): void {
    this.unsubSingleDM?.();
    this.routeSub?.unsubscribe();
    this.messageListSub?.unsubscribe();
    this.routerEventsSub?.unsubscribe();
    this.unsubUserList?.();
    this.unsubList?.();
  }

  get currentUser() {
    return this.directMessageService.currentUserProfile();
  }

  get secondUser() {
    return this.directMessageService.secondUserProfile();
  }

  updateEmojiList(emojis: any) {
    this.parentEmojiList = emojis;
  }

  subscribeToDmChannel() {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.channelId = id;
        this.shouldScroll = true;
        this.isInitialLoad = true;
        this.didFocusInput = false;
        this.waitForUserThenSubscribe(id);
        this.unsubList = this.messageService.subList(this.channelId);
      }
    });
  }

  subscribeToMsgList() {
    this.messageListSub = this.messageService.messageList$.subscribe((msgs) => {
      const wasEmpty = this.messages.length === 0;
      const hadNewMessage = msgs.length > this.previousMessageCount;
      this.messages = msgs;
      setTimeout(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }, 1000);
      if (wasEmpty || (hadNewMessage && this.previousMessageCount > 0)) {
        this.shouldScroll = true;
      }
      this.previousMessageCount = msgs.length;
      this.isInitialLoad = false;
    });
  }

  subThreadRoute() {
    this.routerEventsSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // this.loading = true;
        this.isThreadOpen = this.router.url.includes('threadMessages');
      }
    });
  }

  scrollToBottomInstantly() {
    if (this.scrollContainer?.nativeElement) {
      const el = this.scrollContainer.nativeElement;
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    } else {
      console.log('ScrollContainer not available');
    }
  }

  waitForUserThenSubscribe(id: string) {
    const checkUserInterval = setInterval(() => {
      const currentUser = this.userProfile();
      if (currentUser?.uid) {
        clearInterval(checkUserInterval);
        this.subscribeToDM(id);
        this.senderId = currentUser.uid;
        this.previousMessageCount = 0;
        this.isInitialLoad = true;
      }
    }, 100);
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
    const currentUserId = this.userProfile()?.uid;
    if (!currentUserId) return;
    this.unsubSingleDM?.();
    this.unsubSingleDM = this.directMessageService.subDirectMessageChannel(id, currentUserId);
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

  canSendMessage(): boolean {
    return this.content.trim().length > 0 && !this.isSending();
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

    requestAnimationFrame(() => {
      this.isThreadOpen = true;
      this.cdr.markForCheck();
      this.router.navigate(['directMessages', this.channelId, 'threadMessages', messageId]);
    });
  }

  addEmoji(emoji: any) {
    this.content = this.emojiService.addEmojiToContent(emoji, this.content);
  }

  tagInputStart() {
    this.content = this.userMentionService.tagInputStart(this.content, this.input);
  }

  tagInputChannelStart() {
    this.content = this.userMentionService.tagChannelInputStart(this.content, this.input);
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
    this.userMentionService.onInputChange(this.content, this.mentionMenuTrigger, this.channelMenuTrigger, this.input);
  }

  onEditViewChange(isOpen: boolean) {
    this.parentEditView = isOpen;
  }

  onEmojiClick(emoji: any) {
    this.addEmoji(emoji.code);
    this.emojiService.selectEmoji(emoji.name);
  }

  openMoreEmoji(event: Event) {
    this.emojiService.toggleSmallEmojiInputMenu();
  }
}
