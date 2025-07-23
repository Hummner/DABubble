import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, DocumentData, increment, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc } from '@angular/fire/firestore';
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
  threadPath!: string;
  threadMessageCount!: number;



  constructor() { }


  getThreadsFromTicket(threadPath: string, ticket: TicketInterface) {
    if (this.unsubMessages) {
      this.unsubMessages();
      console.log('alte snap destoyed');
    }
    let getThreadRef = collection(this.firestore, threadPath);
    this.threadPath = threadPath
    this.currentTicketOpened = ticket
    let q = query(getThreadRef, orderBy('createdAt'))
    this.unsubMessages = onSnapshot(q, (msgList) => {
      let messageArray: TicketInterface[] = [];
      this.threadMessageCount = msgList.docs.length
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


  getThreadLenght() {
    return this.threadMessageCount;
  }


  getThreadPath() {
    return this.threadPath
  }

  async addMessageToThread(senderId: string, text: string) {
    const newMessage: TicketInterface = {
      createdAt: serverTimestamp(),
      reactions: [],
      senderId: senderId,
      text: text,
    };

    try {
      await addDoc(collection(this.firestore, this.threadPath), newMessage);
      await this.increaseThreadCounter()
    } catch (error) {
      console.error("Error by add a message", error);
      
    }
  }


  async increaseThreadCounter() {
    let ticketPath = this.threadPath.split("/").slice(0, 4).join("/");
   await updateDoc(doc(this.firestore, ticketPath), { threadsCount: increment(1) })
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
