import { inject, Injectable } from '@angular/core';
import { CollectionReference, doc, Firestore, getDoc, getDocs } from '@angular/fire/firestore';
import { collection, onSnapshot } from '@angular/fire/firestore';
import { ChannelInterface } from '../interfaces/channel.interface';
import { TicketInterface } from '../interfaces/ticket.interface';
import { DocumentData } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChannelsService {
  private channelSubject = new BehaviorSubject<ChannelInterface | null>(null);
  private MessagesSubject = new BehaviorSubject<TicketInterface | null>(null);
  firestore = inject(Firestore);
  channelURL!: string;
  unsubChannel?: () => void;
  // channelId = "KRIw2GN8Ym9EQmijM84l";
  channel$ = this.channelSubject.asObservable()
 

  constructor() {

  }

  getChannel(channelId: string) {
    this.unsubChannel = this.subChannel(channelId);

  }


  getChannelRef(channelId: string) {
    return doc(collection(this.firestore, "channels"), channelId)
  }

  async getChannelInfos(channelData?: DocumentData, channelId?: string) {
    if (channelData && channelId) {
      const channel: ChannelInterface = {
        createdBy: channelData['createdBy'],
        description: channelData['description'],
        members: await this.putMembersToArray(channelData),
        name: channelData['name'],
        messages: this.putMessagesInArray(channelId)
      };

      this.channelSubject.next(channel);
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
    let messagesArray: TicketInterface[] = [];
    let messages = onSnapshot(this.getMessagesSubCollRef(channelId), (msgList) => {
      msgList.docs.forEach(msg => {
        let ticketToJson = this.getTickets(msg.id, msg.data(), channelId)
        if (ticketToJson) {
          messagesArray.push(ticketToJson)
        }
      })
    })
    return messagesArray
  }

  getMessagesSubCollRef(channelId: string) {
    return collection(this.getChannelRef(channelId), "messages")
  }

  getThreadRef(channelId: string, ticketId: string) {
    return collection(doc(this.firestore, "channel", channelId, "messages", ticketId), "threads")

  }




}
