import { inject, Injectable } from '@angular/core';
import { collection, doc, DocumentData, onSnapshot } from '@angular/fire/firestore';
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



  constructor() { }


  getThreadsFromTicket(threadPath: string) {
    let getThreadRef = collection(this.firestore, threadPath);
    this.unsubMessages = onSnapshot(getThreadRef, (msgList) => {
      let messageArray: TicketInterface[] = [];
      msgList.forEach(msg => {
        let message: TicketInterface = this.getMessageToJson(msg.data())
        messageArray.push(message)
        this.messagesSubscribe.next(messageArray);
      });
    });
  }


  getMessageToJson(messageData: DocumentData) {
    let message: TicketInterface = {
          createdAt: messageData['createdAt'],
          reactions: messageData['reactions'],
          senderId: messageData['senderId'],
          text: messageData['text']
        }
        return message
  }
}
