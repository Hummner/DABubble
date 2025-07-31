import { Component, EventEmitter, inject, input, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TicketInterface } from '../../interfaces/ticket.interface';
import { Subscription } from 'rxjs';
import { ThreadService } from '../../services/thread.service';
import { ThreadMessagesComponent } from '../../shared/messages/thread-messages/thread-messages.component';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { doc, FieldValue, getDoc, Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [MatIconModule, ThreadMessagesComponent, CommonModule, FormsModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent implements OnInit, OnDestroy, OnChanges {


  @Output() close = new EventEmitter<void>;
  @Input() tickets?: TicketInterface[];
  @Input() members?: any[];
  @Input() isThreadOpen!: boolean;
  @Input() currentThreadPath?: string;
  firestoreService = inject(FirestoreService);
  private auth = inject(AuthService);

  threadService = inject(ThreadService)
  private messagesSubscription?: Subscription
  messages: TicketInterface[] = [];
  currentTicket!: TicketInterface;
  ticketUserName!: string;
  ticketCreatedAt!: string;
  ticketText!: string;
  textInput!: string;
  messagesCount!: string;
  ticketPath!: string | void;


  constructor() {
  }


  ngOnInit(): void {
    this.messagesSubscription = this.threadService.messagesSubscribe$.subscribe(msgArray => {
      this.messages = msgArray
    });





  }



  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
    if (changes['isThreadOpen'] || this.isThreadOpen || changes['currentThreadPath']) {
      this.currentTicket = this.threadService.getTicketFromChannel();
      if (this.currentTicket) {
        this.createCurrentTicket();
      }
    }

    if (this.currentTicket) {
      // this.messagesCount = this.messagesCounter();
      let path = this.threadService.getTicketPath()
      console.log(path);
    }




  }


  async addMessageToThread() {
    let senderId = this.getCurrentUserId();
    let text = this.textInput;
    this.textInput = "";
    try {
      if (senderId && text) {
        await this.threadService.addMessageToThread(senderId, text);
      }
    } catch (err) {
      console.error("Failed by add a message: ", err);
      this.textInput = text;
    }
  }


  async createCurrentTicket() {
    this.showName();
    this.ticketCreatedAt = this.showTime();
    this.ticketText = this.currentTicket.text;
    this.messagesCount =  await this.messagesCounter();
  }

  showTime(): string {
    return this.currentTicket?.createdAt instanceof Date ? this.currentTicket.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
  }

  showName() {
    const userIndex = this.findUser(this.currentTicket.senderId)

    if (userIndex >= 0 && this.members && this.isMember(userIndex, this.members)) {
      this.ticketUserName = this.members[userIndex]['name']
    } else {
      this.ticketUserName = "Guest"
    }
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

  async messagesCounter() {
    let ticketThread = this.threadService.getTicketPathDoc(this.threadService.getTicketPath());
    let asd = await getDoc(ticketThread)
    if (asd.exists()) {
      console.log(asd.data());
    }





    let number = this.currentTicket.threadsCount ? this.currentTicket.threadsCount : 0;
    if (number > 1) return `${number} Antworten`
    if (number == 1) return '1 Antwort'
    return "Kein Antwort"
  }


  checkTheKey(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (this.textInput != "") {
        this.addMessageToThread();
      }
    }
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


  ngOnDestroy(): void {
    this.messagesSubscription?.unsubscribe();
    console.log("messagesSubctiption destroyed");

  }
}
