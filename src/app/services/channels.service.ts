import { inject, Injectable, OnDestroy } from '@angular/core';
import { CollectionReference, doc, Firestore, getDoc, getDocs, serverTimestamp, Timestamp } from '@angular/fire/firestore';
import { collection, onSnapshot } from '@angular/fire/firestore';
import { ChannelInterface } from '../interfaces/channel.interface';
import { TicketInterface } from '../interfaces/ticket.interface';
import { addDoc, DocumentData, query, orderBy } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChannelsService implements OnDestroy {
  private channelSubject = new BehaviorSubject<ChannelInterface | null>(null);
  private messagesSubject = new BehaviorSubject<TicketInterface[]>([]);
  messages$ = this.messagesSubject.asObservable();
  channel$ = this.channelSubject.asObservable();
  firestore = inject(Firestore);
  channelURL!: string;
  unsubChannel?: () => void;
  unsubMessages?: () => void;
  // channelId = "KRIw2GN8Ym9EQmijM84l";



  constructor() {

  }

  getChannel(channelId: string) {
    this.unsubChannel = this.subChannel(channelId);

  }




  async getChannelInfos(channelData?: DocumentData, channelId?: string) {
    if (channelData && channelId) {
      const channel: ChannelInterface = {
        createdBy: channelData['createdBy'],
        description: channelData['description'],
        members: await this.putMembersToArray(channelData),
        name: channelData['name'],
        messages: []
      };

      this.channelSubject.next(channel);
      this.putMessagesInArray(channelId)
    }
  }

  subChannel(channelId: string) {
    return onSnapshot(this.getChannelRef(channelId), (el) => {
      let channelData = el.data();
      console.log(channelData);
      this.getChannelInfos(channelData, channelId);
    })

  }

  async putMembersToArray(channelData?: DocumentData): Promise<any[]> {
    let members: any[] = [];

    if (channelData && Array.isArray(channelData['members'])) {
      for (let index = 0; index < channelData['members'].length; index++) {
        let idNumber = channelData['members'][index]['id'];
        let user = await getDoc((doc(this.firestore, 'users', idNumber)))
        if (user) {
          members.push(user.data())
        }
      }
    }
    return members

  }

  getTickets(ticketId: string, ticketData: DocumentData, channelId: string) {
    if (ticketData) {
      const ticket: TicketInterface = {
        createdAt: ticketData['createdAt'],
        reactions: ticketData['reactions'],
        senderId: ticketData['senderId'],
        text: ticketData['text'],
        threadsCount: ticketData['threadsCount'],
        threads: this.getThreadRef(channelId, ticketId)
      }
      return ticket
    } else {
      return
    }
  }


  putMessagesInArray(channelId: string) {
    const q = query(this.getMessagesSubCollRef(channelId), orderBy('createdAt'))
    this.unsubMessages = onSnapshot(q, (msgList) => {
      const messagesArray: TicketInterface[] = [];
      msgList.docs.forEach(msg => {
        let ticketToJson = this.getTickets(msg.id, msg.data(), channelId)
        if (ticketToJson) {
          messagesArray.push(ticketToJson)
        }
      });
      this.messagesSubject.next(messagesArray);
    });
  }


  addTicketToChannel(channelId: string, senderId: string, text: string) {
    const newTicket: TicketInterface = {
      createdAt: serverTimestamp(),
      reactions: [],
      senderId: senderId,
      text: text,
      threadsCount: 0,
    };

    addDoc(this.getNewMessageRef(channelId), newTicket)
  }


  getNewMessageRef(channelId: string) {
    return collection(this.firestore, `channels/${channelId}/messages`)
  }


  getMessagesSubCollRef(channelId: string) {
    return collection(this.getChannelRef(channelId), "messages")
  }


  getThreadRef(channelId: string, ticketId: string) {
    return collection(doc(this.firestore, "channels", channelId, "messages", ticketId), "threads")

  }


  getChannelRef(channelId: string) {
    return doc(collection(this.firestore, "channels"), channelId)
  }

  ngOnDestroy(): void {
    this.unsubChannel?.();
    this.unsubMessages?.();
    console.log("Destroyed");

  }

}
