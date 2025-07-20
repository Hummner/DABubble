import { inject, Injectable } from '@angular/core';
import { collection, doc, DocumentData, onSnapshot, Timestamp } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { TicketInterface } from '../interfaces/ticket.interface';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ThreadService {
  firestore = inject(Firestore);
  unsubMessages?: () => void;
  private messagesSubscribe = new BehaviorSubject<TicketInterface[]>([])
  messagesSubscribe$ = this.messagesSubscribe.asObservable();
  currentTicketOpened!: TicketInterface;
  threadPath!:string;



  constructor() { }


  getThreadsFromTicket(threadPath: string, ticket: TicketInterface) {
    if (this.unsubMessages) {
      this.unsubMessages();
      console.log('alte snap destoyed');
    }
    let getThreadRef = collection(this.firestore, threadPath);
    this.threadPath = threadPath
    this.currentTicketOpened = ticket
    this.unsubMessages = onSnapshot(getThreadRef, (msgList) => {
      let messageArray: TicketInterface[] = [];
      msgList.forEach(msg => {
        let message: TicketInterface = this.getMessageToJson(msg.data())
        messageArray.push(message)
      });
      this.messagesSubscribe.next(messageArray);
    });
  }


  getTicketFromChannel() {
    return this.currentTicketOpened
  }


  getThreadPath() {
    return this.threadPath
  }


  getMessageToJson(messageData: DocumentData) {
    const rawCreatedAt = messageData['createdAt'];
    const createdAtDate = rawCreatedAt instanceof Timestamp ? rawCreatedAt.toDate() : null;

    let message: TicketInterface = {
      createdAt: createdAtDate,
      reactions: messageData['reactions'],
      senderId: messageData['senderId'],
      text: messageData['text'],
    }
    return message
  }
}
