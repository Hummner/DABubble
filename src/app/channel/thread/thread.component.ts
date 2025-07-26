import { Component, EventEmitter, inject, input, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TicketInterface } from '../../interfaces/ticket.interface';
import { Subscription } from 'rxjs';
import { ThreadService } from '../../services/thread.service';
import { ThreadMessagesComponent } from '../../shared/messages/thread-messages/thread-messages.component';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { FieldValue, Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [MatIconModule, ThreadMessagesComponent, CommonModule],
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
        console.log('neue Pfad: ', this.currentThreadPath);
      }
      console.log("Das Ticket was ich suche: ", this.currentTicket);
    }
  }

  createCurrentTicket() {
    this.showName();
    this.ticketCreatedAt = this.showTime()
    this.ticketText = this.currentTicket.text
  }

  showTime():string {
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


  // getChannelId() {
  //   this.channelId = this.route.params.subscribe(params => {
  //     const channelId = params['ChannelId'];
  //     return channelId
  //   })
  // }

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
