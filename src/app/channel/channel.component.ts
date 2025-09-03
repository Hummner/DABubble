import {
  AfterViewChecked,
  booleanAttribute,
  Component,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
  output,
  ViewChild,
  NgZone,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatDrawerMode, MatSidenavModule } from '@angular/material/sidenav';
import { ThreadComponent } from './thread/thread.component';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { TicketComponent } from '../shared/messages/ticket/ticket.component';
import { ChannelsService } from '../services/channels.service';
import { ChannelInterface } from '../interfaces/channel.interface';
import { FormsModule } from '@angular/forms';
import { user } from '@angular/fire/auth';
import { AuthService } from '../services/auth.service';
import { FirestoreService } from '../services/firestore.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TicketInterface } from '../interfaces/ticket.interface';
import { ThreadService } from '../services/thread.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Timestamp } from '@angular/fire/firestore';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmojiArrayService } from '../services/emoji-array.service';
import { AddMemberComponent } from '../channel/add-member/add-member.component';
import { MatDialog } from '@angular/material/dialog';
import { UserProfileInterface } from '../interfaces/user-profile.interface';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [
    MatIconModule,
    MatSidenavModule,
    ThreadComponent,
    MatMenuModule,
    CommonModule,
    TicketComponent,
    FormsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss',
})
export class ChannelComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('discInput') discInput!: ElementRef<HTMLInputElement>;
  @ViewChild('chat') chatContainer!: ElementRef<HTMLInputElement>;
  @ViewChild('chat_input') chatInput!: ElementRef<HTMLTextAreaElement>;

  channelsService = inject(ChannelsService);
  threadsServvice = inject(ThreadService);
  firestoreService = inject(FirestoreService);
  private auth = inject(AuthService);
  emojiArray = inject(EmojiArrayService);
  userProfile = this.firestoreService.userProfile;
  user: UserProfileInterface | null = null;
  showMenu = false;
  menuOpen = false;
  editName = false;
  editDisc = false;
  channel: ChannelInterface | null = null;
  textInput: string = '';
  private channelSubscription?: Subscription;
  private messagesSubscription?: Subscription;
  messages: TicketInterface[] = [];
  channelId!: string;
  routeSub?: Subscription;
  isThreadOpen = false;
  currentThreadPath?: string;
  loading = false;
  isMessage = false;
  initialScrollDone = false;
  drawerMode!: MatDrawerMode;
  originalChannelName: string = '';
  channelNameExists = false;

  windowWidth = window.innerWidth;

  constructor(private route: ActivatedRoute, private router: Router, private dialog: MatDialog, private ngZone: NgZone) {}

  ngOnInit(): void {
    // this.focusTextarea();

    this.loading = true;
    this.getActiveRoute();
    console.log(window.innerWidth);
    this.checkWindowWidth();
    this.channelSubscription = this.channelsService.channel$.subscribe((channel) => {
      if (channel) {
        this.channel = channel;
        console.log('Channel empfangen:', this.channel);
        this.loading = false;
        this.initialScrollDone = false;
      }
    });

    this.getChannelInfo();
    this.messagesSubscription = this.channelsService.messages$.subscribe((msgs) => {
      if (this.channel) {
        this.channel.messages = msgs;
        if (this.channel.messages.length > 0) {
          this.isMessage = true;
        }
      }
    });
  }

  ngAfterViewChecked() {
    if (!this.initialScrollDone && this.channel?.messages.length) {
      this.scrollToBottom();
      this.initialScrollDone = true;
    }
  }

  checkWindowWidth() {
    if (window.innerWidth > 1024) {
      this.drawerMode = 'side';
    } else {
      this.drawerMode = 'over';
    }
  }

  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number) {
    this.windowWidth = width;
    this.checkWindowWidth();
    if (this.windowWidth >= 1400) {
    }
  }

  currentThreadPathRef(data: string) {
    this.currentThreadPath = data;
  }

  getActiveRoute() {
    this.route.params.subscribe((params) => {
      if (params) {
        this.loading = true;
        this.channelId = params['ChannelId'];
      }
    });
  }

  getCurrentUserId(): string | null {
    return this.auth.firebaseAuth.currentUser?.uid ?? null;
  }

  openMenu(trigger: MatMenuTrigger) {
    trigger.openMenu();
    this.menuOpen = true;
  }

  openEmojiMenu(trigger: MatMenuTrigger) {
    trigger.openMenu();
  }

  get emojiList() {
    return this.emojiArray.emojiList;
  }

  get emojiUsageHistory() {
    return this.emojiArray.emojiUsageHistory;
  }

  get sortedEmoji() {
    const historySet = new Set(this.emojiUsageHistory);
    const recentFirst = this.emojiUsageHistory.filter((e) => this.emojiList.includes(e));
    const rest = this.emojiList.filter((e) => !historySet.has(e));
    return [...recentFirst, ...rest];
  }

  selectEmoji(emoji: string) {
    this.emojiArray.emojiUsageHistory = [emoji, ...this.emojiUsageHistory.filter((e) => e !== emoji)];
    console.log('Selected Emojio: ', emoji);
  }

  showPlaceholder(index: number): string {
    const createdAt = this.channel?.messages[index]?.createdAt;
    const today = new Date().toLocaleDateString('de-De', { weekday: 'long', day: 'numeric', month: 'long' });
    let date: Date | null = null;
    let dateCopy: string;

    date = this.convertToDate(createdAt);
    if (date) {
      dateCopy = date.toLocaleDateString('de-De', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    if (dateCopy! && dateCopy == today) return 'Heute';

    return date ? date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) : '-';
  }

  isTheSameDate(index: number) {
    let isSame: boolean;
    if (index == 0) return (isSame = false);

    let thisTicketDate = this.channel?.messages[index]?.createdAt;
    let lastTicketDate = this.channel?.messages[index - 1]?.createdAt;

    thisTicketDate = this.convertToDate(thisTicketDate);
    lastTicketDate = this.convertToDate(lastTicketDate);

    if (thisTicketDate && lastTicketDate) {
      let thisTicketDateDatefrom = thisTicketDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
      let lastTicketDateDatefrom = lastTicketDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
      if (thisTicketDateDatefrom === lastTicketDateDatefrom) return (isSame = true);
    }
    return false;
  }

  convertToDate(dateToConvert: any): Date | null {
    if (dateToConvert instanceof Date) return dateToConvert;
    if (dateToConvert instanceof Timestamp) return dateToConvert.toDate();
    return null;
  }

  checkTheKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (this.textInput != '') {
        this.addTicket();
      }
    }
  }

  closeMenu(trigger: MatMenuTrigger) {
    trigger.closeMenu();
  }

  editChannel(editField: string) {
    if (editField === 'editName') {
      this.originalChannelName = this.channel?.name || '';
      this.editName = true;
      this.nameInput.nativeElement.focus();
      this.focusAfterText(this.nameInput);
    }
    if (editField === 'editDisc') {
      this.editDisc = true;
      setTimeout(() => {
        this.discInput.nativeElement.focus();
        this.focusAfterText(this.discInput);
      }, 1);
    }
  }

  focusAfterText(inputRef: ElementRef<HTMLInputElement>) {
    let input = inputRef.nativeElement;
    let length = input.value.length;
    input.setSelectionRange(length, length);
  }

  editChannelClose(editField: string) {
    if (editField === 'editName') {
      this.editName = false;
      this.nameInput.nativeElement.blur();
    }
    if (editField === 'editDisc') {
      this.editDisc = false;
      this.discInput.nativeElement.blur();
    }
    this.checkValidation().then((isValid) => {
      if (isValid) {
        this.channelsService.updateEditChannel(
          this.channelId,
          this.nameInput.nativeElement.value,
          this.discInput.nativeElement.value
        );
      }
    });
  }

  getChannelInfo() {
    return this.channelsService.getChannel(this.channelId);
  }

  addTicket() {
    const currentUser = this.getCurrentUserId();
    const textMessage = this.textInput;
    console.log(currentUser, ': ', textMessage);
    this.initialScrollDone = false;

    if (currentUser && textMessage) {
      this.channelsService.addTicketToChannel(this.channelId, currentUser, textMessage);
    } else {
      console.error('No User or Text');
    }
  }

  scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }

  ngOnDestroy(): void {
    this.channelSubscription?.unsubscribe();
    this.messagesSubscription?.unsubscribe();
    console.log('Unsubscribed on Channel');
  }

  addMemberDialog() {
    this.dialog.open(AddMemberComponent, {
      data: {
        channelName: this.channel?.name,
        channelId: this.channelId,
      },
    });
  }

  async leaveChannel(userProfile: UserProfileInterface | null, editChannelMenuTrigger: MatMenuTrigger) {
    let currentChannel = this.channelsService.getChannel(this.channelId);
    this.channelsService.deleteMember(currentChannel, userProfile);
    this.closeMenu(editChannelMenuTrigger);

    let allChannels = this.channelsService.getAllChannels();
    for (const channel of await allChannels) {
      channel.members = channel.members.filter((member: any) => member.id !== userProfile?.uid);
    }
  }

  focusTextarea() {
    this.channelsService.focusRequest$.subscribe(() => {
      this.ngZone.onStable.subscribe(() => {
        this.chatInput.nativeElement.focus();
      });
    });
  }

  async checkValidation() {
    let channelName = this.nameInput.nativeElement.value.trim();
    let allChannels = await this.channelsService.getAllChannels();

    const exists = allChannels.some((channel) => channel.name === channelName && channelName !== this.originalChannelName);

    this.channelNameExists = exists;
    this.resetChannelName(this.channelNameExists);
    return !exists;
  }

  resetChannelName(exists: boolean) {
    if (exists) {
      setTimeout(() => {
        this.nameInput.nativeElement.value = this.originalChannelName;
        this.channelNameExists = false;
      }, 2000);
    }
  }
}
