import { Component, ElementRef, EventEmitter, inject, input, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TicketInterface } from '../../interfaces/ticket.interface';
import { Subscription } from 'rxjs';
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
import { ActivatedRoute } from '@angular/router';
import { filter, distinctUntilChanged, flatMap } from 'rxjs/operators';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [MatIconModule, ThreadMessagesComponent, CommonModule, FormsModule, MatMenuModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent implements OnInit, OnDestroy {

  @ViewChild('mentionTrigger') mentionMenuTrigger!: MatMenuTrigger;
  @ViewChild('channelTrigger') channelMenuTrigger!: MatMenuTrigger;
  @ViewChild('chat_input') chatInput!: ElementRef<HTMLTextAreaElement>;


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

  threadService = inject(ThreadService);
  private messagesSubscription?: Subscription;
  private currentTicketSubscription?: Subscription;
  currentTicketSub!: TicketInterface;
  messages: TicketInterface[] = [];
  currentTicket!: TicketInterface;
  ticketUserName!: string;
  ticketCreatedAt!: string;
  ticketText!: string;
  textInput: string = "";
  messagesCount!: string;
  ticketPath!: string | void;
  number?: number
  isCurrentEdited: boolean = false;
  isSending = false


  constructor() {
  }

  ngOnInit(): void {

    this.messagesSubscription = this.threadService.messagesSubscribe$.pipe(
      filter((arr): arr is TicketInterface[] => Array.isArray(arr)), distinctUntilChanged((a, b) => {
        if (a.length !== b.length) return false;
        const la = a[a.length - 1];
        const lb = b[b.length - 1];
        return la?.createdAt === lb?.createdAt && la?.text === lb?.text;
      })
    ).subscribe(msgArray => {
      this.messages = msgArray
    });

    this.currentTicketSubscription = this.threadService.currentTicketSubscribe$.pipe(
      filter((t): t is TicketInterface => !!t), distinctUntilChanged((a, b) => a.text === a.text && a.createdAt === b.createdAt)
    ).subscribe(ticket => {
      this.currentTicket = ticket
      console.log(this.currentTicket);
      this.messagesCount = this.messagesCounter();
    });
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
    console.log("messagesSubctiption und currentTicketSubscription destroyed");

  }
}
