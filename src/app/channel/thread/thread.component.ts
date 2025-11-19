import { AfterViewChecked, Component, ElementRef, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TicketInterface } from '../../interfaces/ticket.interface';
import { Subject, Subscription } from 'rxjs';
import { ThreadService } from '../../services/thread.service';
import { ThreadMessagesComponent } from '../../shared/messages/thread-messages/thread-messages.component';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { doc, FieldValue, Firestore, getDoc, Timestamp } from '@angular/fire/firestore';
import { CommonModule, getLocaleFirstDayOfWeek } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { UserMentionService } from '../../services/user-channel-mention.service';
import { EmojiServiceService } from '../../services/emoji.service';
import { EmojiArrayService } from '../../services/emoji-array.service';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, distinctUntilChanged, flatMap, map } from 'rxjs/operators';
import { ChannelsService } from '../../services/channels.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [MatIconModule, ThreadMessagesComponent, CommonModule, FormsModule, MatMenuModule, MatProgressSpinnerModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('mentionTrigger') mentionMenuTrigger!: MatMenuTrigger;
  @ViewChild('channelTrigger') channelMenuTrigger!: MatMenuTrigger;
  @ViewChild('chat_input') chatInput!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('chat') chatContainer!: ElementRef<HTMLInputElement>;

  @Output() close = new EventEmitter<void>;
  @Input() tickets?: TicketInterface[];
  @Input() members?: any[];
  @Input() isThreadOpen!: boolean;
  @Input() currentThreadPath?: string;
  firestoreService = inject(FirestoreService);
  userMentionService = inject(UserMentionService);
  private auth = inject(AuthService);
  emojiService = inject(EmojiServiceService);
  emojiArray = inject(EmojiArrayService);
  threadsService = inject(ThreadService);
  channelService = inject(ChannelsService)
  threadService = inject(ThreadService);
  private messagesSubscription?: Subscription;
  private currentTicketSubscription?: Subscription;
  private currentChannelSubscription?: Subscription
  currentTicketSub!: TicketInterface;
  messages: TicketInterface[] = [];
  currentTicket!: TicketInterface;
  ticketUserName!: string;
  ticketCreatedAt!: string;
  ticketText!: string;
  textInput: string = "";
  messagesCount!: string;
  ticketPath!: string | void;
  number?: number;
  isCurrentEdited: boolean = false;
  isSending = false;
  loading = true;
  firstSeen = false;
  initialScrollDone = false;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngAfterViewChecked() {
    if (!this.initialScrollDone && this.messages.length) {
      this.scrollToBottom();
      this.initialScrollDone = true;
    }
    if (this.loading) {
      this.chatInput?.nativeElement.focus();
    }
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => params.get('messageId')),
        distinctUntilChanged()
      )
      .subscribe(messageId => {
        if (!messageId) return;
        this.setupThread();
      });
    
  }

  setupThread() {
    this.setupLoadingSpinner();
    this.setupMessagesSub();
    this.setupCurrentTicketSub();
    this.setupMembersSub();
    this.setupThreadMessages();
  }

  setupLoadingSpinner() {
    this.threadService.loadingThread$.subscribe((spinner) => {
      this.loading = spinner;
    });
  }

  setupMessagesSub() {
    this.messagesSubscription = this.threadService.messagesSubscribe$
      .pipe(
        filter((arr): arr is TicketInterface[] => Array.isArray(arr)),
        distinctUntilChanged((a, b) => {
          if (a.length !== b.length) return false;
          const la = a[a.length - 1];
          const lb = b[b.length - 1];
          return la?.createdAt === lb?.createdAt && la?.text === lb?.text;
        })
      )
      .subscribe(msgArray => {
        this.messages = msgArray;
      });
  }

  setupCurrentTicketSub() {
    this.currentTicketSubscription = this.threadService.currentTicketSubscribe$.pipe(
      filter((t): t is TicketInterface => !!t), distinctUntilChanged((a, b) => a.text === a.text && a.createdAt === b.createdAt)
    ).subscribe(ticket => {
      this.currentTicket = ticket
      this.messagesCount = this.messagesCounter();
    });
  }

  setupMembersSub() {
    this.currentChannelSubscription = this.channelService.channel$
      .subscribe(c => this.members = c?.members);
  }

  setupThreadMessages() {
    let urlIds = this.getUrlIds()
    this.threadsService.getThreadsFromTicket(urlIds.tikcetId, urlIds.channelId, urlIds.apiPath);
    this.threadsService.getCurrentTicket();
    this.isThreadOpen = this.isThreadOpenFunc();
  }

  getUrlIds() {
    const parts = this.router.url.replace(/^\/+/, '').split('/')
    parts[0] = 'channels';

    if (parts[3].includes('?')) {
      parts[3] = this.removeParamFromUrl(parts)
    }

    const apiPath = parts.join('/');
    const [, channelId, , tikcetId] = parts;

    return { channelId: parts[1], tikcetId: parts[3], apiPath: apiPath }
  }

  removeParamFromUrl(parts: string[]) {
    const removeParam = parts[3].split('?')
    return parts[3] = removeParam[0]
  }

  isThreadOpenFunc() {
    return !!this.router.url.split('/')[4];
  }

  checkTheKey(event: KeyboardEvent) {
    event.preventDefault();
    if (event.key === 'Enter' && event.shiftKey) {

    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (this.textInput != '') {
        if (this.textInput.trim() !== '') {
          this.textInput = this.textInput.replace(/\n/g, '').trim();
          this.addMessageToThread();
        }
      }
    }
  }

  async addMessageToThread() {
    if (!this.canSendMessage()) return
    this.isSending = true;
    let senderId = this.getCurrentUserId();
    let text = this.textInput;
    try {
      if (senderId && text.trim().length !== 0) {
        await this.threadService.addMessageToThread(senderId, text).then(() => {
          this.textInput = "";
          this.isSending = false
          this.scrollToBottom();
        });
      }
    } catch (err) {
      console.error("Failed by add a message: ", err);
      this.textInput = text;
    }
  }

  showTime(): string {
    const createdAtDate = this.currentTicket?.createdAt instanceof Timestamp ? this.currentTicket?.createdAt.toDate() : null;
    return createdAtDate instanceof Date ? createdAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
  }

  showPlaceholder(index: number): string {
    const createdAt = this.messages[index]?.createdAt;
    const today = new Date().toLocaleDateString('de-De', { weekday: 'long', day: 'numeric', month: 'long' })
    let date: Date | null = null;
    let dateCopy: string;

    date = this.convertToDate(createdAt)
    if (date) {
      dateCopy = date.toLocaleDateString('de-De', { weekday: 'long', day: 'numeric', month: 'long' })
    }
    if (dateCopy! && dateCopy == today) return "Heute"

    return date ? date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }) : '-';
  }

  isTheSameDate(index: number) {
    let isSame: boolean;
    if (index == 0) return isSame = false;

    let thisTicketDate = this.messages[index]?.createdAt;
    let lastTicketDate = this.messages[index - 1]?.createdAt;

    thisTicketDate = this.convertToDate(thisTicketDate);
    lastTicketDate = this.convertToDate(lastTicketDate);

    if (thisTicketDate && lastTicketDate) {
      let thisTicketDateDatefrom = thisTicketDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
      let lastTicketDateDatefrom = lastTicketDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
      if (thisTicketDateDatefrom === lastTicketDateDatefrom) return isSame = true;
    }
    return false
  }

  scrollToBottom(): void {
    try {

      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      // this.chatContainer.nativeElement.scrollIntoView({ behavior: "smooth", block: "end"})
    } catch (err) { }
  }

  convertToDate(dateToConvert: any): Date | null {
    if (dateToConvert instanceof Date) return dateToConvert;
    if (dateToConvert instanceof Timestamp) return dateToConvert.toDate();
    return null;
  }

  messagesCounter() {
    let number = this.currentTicket.threadsCount ? this.currentTicket.threadsCount : 0;
    if (number > 1) return `${number} Antworten`
    if (number == 1) return '1 Antwort'
    return "Keine Antwort"
  }

  closeThread() {
    const channelPath = this.router.url.split('/')[2]
    this.router.navigate(['channel', channelPath])
  }

  takeUser(name: string) {
    this.textInput = this.userMentionService.takeUser(name, this.textInput);
  }

  takeChannel(name: string) {
    this.textInput = this.userMentionService.takeChannel(name, this.textInput);
  }

  tagInputStart() {
    this.textInput = this.userMentionService.tagInputStart(this.textInput, this.chatInput);
  }

  tagInputChannelStart() {
    this.textInput = this.userMentionService.tagChannelInputStart(this.textInput, this.chatInput);
  }

  openEmojiMenu(trigger: MatMenuTrigger) {
    trigger.openMenu();
  }

  onInputChange(event: Event) {
    this.userMentionService.onInputChange(this.textInput, this.mentionMenuTrigger, this.channelMenuTrigger, this.chatInput);
  }

  addEmoji(emoji: any) {
    this.textInput = this.emojiService.addEmojiToContent(emoji, this.textInput);
  }

  onEmojiClick(emoji: any) {
    this.addEmoji(emoji.code);
    this.emojiService.selectEmoji(emoji.name);
  }


  findUser(uId: string): number {
    if (this.members) {
      return this.members.findIndex(member => member.uid === uId);
    }
    return -1;
  }

  isMember(userIndex: number, members: any[]): boolean {
    return userIndex >= 0 && !!members[userIndex];
  }

  getCurrentUserId() {
    return this.auth.firebaseAuth.currentUser?.uid ?? null;
  }

  isCurrentUser() {
    return (this.getCurrentUserId() === this.currentTicket.senderId)
  }

  canSendMessage(): boolean {
    return this.textInput.trim().length > 0 && !this.isSending;
  }

  ngOnDestroy(): void {
    this.messagesSubscription?.unsubscribe();
    this.currentTicketSubscription?.unsubscribe();
    this.loading = false
  }
}
