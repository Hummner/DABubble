import { AfterViewChecked, Component, ElementRef, HostListener, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatDrawerMode, MatSidenavModule } from '@angular/material/sidenav';
import { ThreadComponent } from './thread/thread.component';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { TicketComponent } from '../shared/messages/ticket/ticket.component';
import { ChannelsService } from '../services/channels.service';
import { ChannelInterface } from '../interfaces/channel.interface';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { FirestoreService } from '../services/firestore.service';
import { distinctUntilChanged, filter, map, startWith, Subscription } from 'rxjs';
import { TicketInterface } from '../interfaces/ticket.interface';
import { ThreadService } from '../services/thread.service';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Timestamp } from '@angular/fire/firestore';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EmojiArrayService } from '../services/emoji-array.service';
import { AddMemberComponent } from '../channel/add-member/add-member.component';
import { MatDialog } from '@angular/material/dialog';
import { UserProfileInterface } from '../interfaces/user-profile.interface';
import { UserMentionService } from '../services/user-channel-mention.service';
import { EmojiServiceService } from '../services/emoji.service';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [
    MatIconModule, MatSidenavModule, MatMenuModule, CommonModule, TicketComponent, FormsModule, MatProgressSpinnerModule,
    RouterOutlet
  ],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss',
})
export class ChannelComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('discInput') discInput!: ElementRef<HTMLInputElement>;
  @ViewChild('chat') chatContainer!: ElementRef<HTMLInputElement>;
  @ViewChild('chat_input') chatInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('mentionTrigger') mentionMenuTrigger!: MatMenuTrigger;
  @ViewChild('channelTrigger') channelMenuTrigger!: MatMenuTrigger;
  @ViewChild('threadTrigger') threadTrigger!: MatDrawer;
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  channelsService = inject(ChannelsService);
  threadsServvice = inject(ThreadService);
  firestoreService = inject(FirestoreService);
  private auth = inject(AuthService);
  emojiArray = inject(EmojiArrayService);
  emojiService = inject(EmojiServiceService)
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
  isSending = false
  private routerSub?: Subscription;
  stopAutoFokus = false;

  constructor(
    private route: ActivatedRoute, private router: Router, private dialog: MatDialog, public userMentionService: UserMentionService) { }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => params.get('ChannelId')),
        distinctUntilChanged()
      )
      .subscribe(channelId => {
        if (!channelId) return;
        this.setupChannel();
      });
  }

  setupChannel() {
    this.loading = true;
    this.getActiveRoute();
    this.checkWindowWidth();
    this.setupChannelSubscription();
    this.getChannelInfo();
    this.setupMessagesSubscription();
    this.channelsService.focusRequest$.subscribe(() => {
      this.stopAutoFokus = false;
      this.focusTextarea();
    });
    this.setupThreadSubscripton()

  }

  setupThreadSubscripton() {
    this.routerSub = this.router.events.pipe(
      startWith(null),
      filter(ev => ev === null || ev instanceof NavigationEnd),
      map(() => {
        let r = this.route;
        while (r.firstChild) r = r.firstChild;

        if (!r.snapshot || !r.snapshot.paramMap) {
          return false;
        }

        return !!r.snapshot.paramMap.get('messageId');
      }),
      distinctUntilChanged()
    ).subscribe(open => this.isThreadOpen = open);
  }


  setupChannelSubscription() {
    this.channelSubscription = this.channelsService.channel$.subscribe((channel) => {
      if (channel) {
        this.channel = channel;
        this.loading = false;
        this.initialScrollDone = false;
      }
    });
  }

  setupMessagesSubscription() {
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
    this.focusTextarea();
  }

  checkWindowWidth() {
    if (window.innerWidth > 1500) {
      this.drawerMode = 'side';
    } else {
      this.drawerMode = 'over';
    }
  }

  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number) {
    this.windowWidth = width;
    this.checkWindowWidth();
    if (this.windowWidth >= 1500) {
    }
  }

  @HostListener('window:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const clickedInsideTextarea = this.chatInput?.nativeElement.contains(event.target as Node);
    const clickedChannelList = (event.target as HTMLElement).closest('.channel-item');
    const clickedHeaderSearch = (event.target as HTMLElement).closest('.search-container');

    if (clickedChannelList) return

    this.removeFokusFromTextarea(clickedInsideTextarea, clickedHeaderSearch);
  }

  removeFokusFromTextarea(clickedInsideTextarea: boolean, clickedHeaderSearch: Element | null) {
    if (!clickedInsideTextarea) {
      this.stopAutoFokus = true;
      this.chatInput.nativeElement.blur();

      if (clickedHeaderSearch) {
        this.channelsService.focusSearchInput();
      }
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

  isTheSameDate(index: number): boolean {
    if (index == 0) return false;

    let thisTicketDate = this.convertToDate(this.channel?.messages[index]?.createdAt);
    let lastTicketDate = this.convertToDate(this.channel?.messages[index - 1]?.createdAt);
    return this.checkTicketDate(thisTicketDate, lastTicketDate);
  }

  checkTicketDate(thisTicketDate: Date | null, lastTicketDate: Date | null): boolean {
    if (!thisTicketDate || !lastTicketDate) return false;

    const thisDate = thisTicketDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    const lastDate = lastTicketDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    return thisDate === lastDate;
  }

  convertToDate(dateToConvert: any): Date | null {
    if (dateToConvert instanceof Date) return dateToConvert;
    if (dateToConvert instanceof Timestamp) return dateToConvert.toDate();
    return null;
  }

  checkTheKey(event: KeyboardEvent) {
    event.preventDefault();
    if (event.key === 'Enter' && event.shiftKey) {

    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.textInput != '') {
        if (this.textInput.trim() !== '') {
          this.textInput = this.textInput.replace(/\n/g, '').trim();
          this.addTicket();
        }
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
    } else if (editField === 'editDisc') {
      this.editDisc = true;
      setTimeout(() => {
        this.discInput.nativeElement.focus();
        this.focusAfterText(this.discInput);
      }, 1);
    }
  }

  focusAfterText(inputRef: ElementRef<HTMLInputElement> | ElementRef<HTMLTextAreaElement>) {
    let input = inputRef.nativeElement;
    let length = input.value.length;
    input.setSelectionRange(length, length);
  }

  editChannelClose(editField: string) {
    if (editField === 'editName') {
      this.editChannelName();
    }
    if (editField === 'editDisc') {
      this.editChannelDescription();
    }
  }

  editChannelName() {
    this.editName = false;
    this.nameInput.nativeElement.blur();
    this.checkValidation().then((isValid) => {
      if (isValid) {
        this.channelsService.updateChannelName(
          this.channelId,
          this.nameInput.nativeElement.value
        );
        this.router.navigate([`/channel/${this.channelId}`]);
      }
    });
  }

  editChannelDescription() {
    this.editDisc = false;
    this.discInput.nativeElement.blur();
    this.channelsService.updateChannelDescription(
      this.channelId,
      this.discInput.nativeElement.value
    );
  }

  getChannelInfo() {
    return this.channelsService.getChannel(this.channelId);
  }

  async addTicket() {
    if (!this.canSendMessage()) return
    this.isSending = true;
    const currentUser = this.getCurrentUserId();
    let textMessage = this.textInput;

    if (currentUser && textMessage.trim().length != 0) {
      this.isMessage = false;
      await this.channelsService.addTicketToChannel(this.channelId, currentUser, textMessage);
      this.initialScrollDone = false;
      this.textInput = "";
      this.scrollToBottom()
      this.isMessage = true;
      this.isSending = false;
    }
  }

  scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  ngOnDestroy(): void {
    this.channelSubscription?.unsubscribe();
    this.messagesSubscription?.unsubscribe();
  }

  addMemberDialog() {
    this.dialog.open(AddMemberComponent, {
      data: {
        channelName: this.channel?.name,
        channelId: this.channelId,
        channelMembers: this.channel?.members
      },
    });
  }

  async leaveChannel(userProfile: UserProfileInterface | null, editChannelMenuTrigger: MatMenuTrigger) {
    let currentChannel = this.channelsService.getChannel(this.channelId);
    this.channelsService.deleteMember(currentChannel, userProfile);
    this.closeMenu(editChannelMenuTrigger);
    this.router.navigateByUrl('/dashboard');

    let allChannels = this.channelsService.getAllChannels();
    for (const channel of await allChannels) {
      channel.members = channel.members.filter((member: any) => member.id !== userProfile?.uid);
    }
  }

  focusTextarea() {
    if (this.chatInput && !this.loading && !this.stopAutoFokus) {
      this.chatInput.nativeElement.focus();
    }
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

  takeUser(name: string) {
    this.textInput = this.userMentionService.takeUser(name, this.textInput);
  }

  focusAfterTag(input: string) {
    let length = input.length;
    this.chatInput.nativeElement.setSelectionRange(length, length);
  }

  tagInputStart() {
    this.textInput = this.userMentionService.tagInputStart(this.textInput, this.chatInput);
  }

  tagInputChannelStart() {
    this.textInput = this.userMentionService.tagChannelInputStart(this.textInput, this.chatInput);
  }

  takeChannel(name: string) {
    this.textInput = this.userMentionService.takeChannel(name, this.textInput);
  }

  addEmoji(emoji: any) {
    this.textInput = this.emojiService.addEmojiToContent(emoji, this.textInput);
  }

  onEmojiClick(emoji: any) {
    this.addEmoji(emoji.code);
    this.emojiService.selectEmoji(emoji.name);
  }

  onInputChange(event: Event) {
    this.userMentionService.onInputChange(this.textInput, this.mentionMenuTrigger, this.channelMenuTrigger, this.chatInput);
  }

  canSendMessage(): boolean {
    return this.textInput.trim().length > 0 && !this.isSending;
  }

}

