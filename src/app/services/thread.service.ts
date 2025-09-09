import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, DocumentData, FieldValue, increment, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { TicketInterface } from '../interfaces/ticket.interface';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ThreadService {
  firestore = inject(Firestore);
  unsubMessages?: () => void;
  unsubCurrentTicket?: () => void;
  private messagesSubscribe = new BehaviorSubject<TicketInterface[]>([])
  messagesSubscribe$ = this.messagesSubscribe.asObservable();
  private currentTicketSubscribe = new BehaviorSubject<TicketInterface>({} as TicketInterface);
  currentTicketSubscribe$ = this.currentTicketSubscribe.asObservable();
  currentTicketOpened!: TicketInterface;
  threadPath!: string;
  threadMessageCount!: number;
  threadTimes: Date[] = [];



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
        let message: TicketInterface = this.getMessageToJson(msg.data(), msg.id)
        messageArray.push(message)
      });
      this.messagesSubscribe.next(messageArray);

    });
  }

  getCurrentTicket() {
    let ticketPath = this.getTicketPathDoc(this.getTicketPath());
    this.unsubCurrentTicket = onSnapshot(ticketPath, (ticket) => {
      let ticketData = ticket.data() as TicketInterface;;
      this.currentTicketSubscribe.next(ticketData);
    });
  }


  getThreadPath() {
    return this.threadPath
  }

  getThreadMesssageRef(id: string) {
    let path = this.threadPath + `/${id}`;
    console.log(path);

    return doc(this.firestore, path)
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
      await this.addLastAnswerDate(newMessage.createdAt)
    } catch (error) {
      console.error("Error by add a message", error);

    }
  }

  async addLastAnswerDate(time: FieldValue | Date | null) {
    let ticketPath = this.getTicketPath();
    await updateDoc(doc(this.firestore, ticketPath), { lastThread: time })
  }


  async increaseThreadCounter() {
    let ticketPath = this.getTicketPath();
    await updateDoc(doc(this.firestore, ticketPath), { threadsCount: increment(1) })
  }

  getTicketPath() {
    return this.threadPath.split("/").slice(0, 4).join("/");
  }

  getTicketPathDoc(ticketPath: string) {
    return doc(this.firestore, ticketPath)
  }


  getMessageToJson(messageData: DocumentData, threadMessageId: string) {
    const rawCreatedAt = messageData['createdAt'];
    const createdAtDate = rawCreatedAt instanceof Timestamp ? rawCreatedAt.toDate() : null;
    if(createdAtDate) {
      this.threadTimes.push(createdAtDate);
      console.log(this.threadTimes);
      
    }

    let message: TicketInterface = {
      createdAt: createdAtDate,
      reactions: messageData['reactions'],
      senderId: messageData['senderId'],
      text: messageData['text'],
      threadMessageId: threadMessageId
    }
    

    return message
  }

  getLastThread() {

  }
}
