import { inject, Injectable, OnDestroy } from '@angular/core';
import { doc, DocumentReference, Firestore, getCountFromServer, getDoc, getDocs, serverTimestamp, Timestamp, updateDoc } from '@angular/fire/firestore';
import { collection, onSnapshot } from '@angular/fire/firestore';
import { ChannelInterface } from '../interfaces/channel.interface';
import { TicketInterface } from '../interfaces/ticket.interface';
import { addDoc, DocumentData, query, orderBy } from '@angular/fire/firestore';
import { BehaviorSubject, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { user } from '@angular/fire/auth';
import { FirestoreService } from './firestore.service';

@Injectable({
  providedIn: 'root'
})
export class ChannelsService implements OnDestroy {
  private channelSubject = new BehaviorSubject<ChannelInterface | null>(null);
  private messagesSubject = new BehaviorSubject<TicketInterface[]>([]);
  private focusRequest = new Subject<void>();
  firestoreService = inject(FirestoreService);
  focusRequest$ = this.focusRequest.asObservable();
  messages$ = this.messagesSubject.asObservable();
  channel$ = this.channelSubject.asObservable();
  firestore = inject(Firestore);
  channelURL!: string;
  unsubChannel?: () => void;
  unsubMessages?: () => void;

  constructor() { }

  getChannel(channelId: string) {
    this.unsubChannel = this.subChannel(channelId);
    return channelId;
  }

  async getAllChannels() {
    const channelsCol = collection(this.firestore, 'channels');
    const snapshot = await getDocs(channelsCol);
    const channels = snapshot.docs.map(doc => ({
      channelId: doc.id,
      createdBy: doc.data()['createdBy'],
      members: doc.data()['members'] || [],
      name: doc.data()['name'],
      ...doc.data()
    }));
    return channels;
  }

  async getCurrentChannel(channelId: string): Promise<{ channelId: string; members: any[] } | null> {
    const channelRef = doc(this.firestore, 'channels', channelId);
    const channelSnap = await getDoc(channelRef);

    if (!channelSnap.exists()) {
      console.warn('Channel nicht gefunden:', channelId);
      return null;
    }
      const channel = {
        channelId: channelSnap.id,
        members: channelSnap.data()['members'] || [],
      };
      return channel;
  }

  async updatedChannels(user: any) {
    const updatedMember = user;
    const channels = await this.getAllChannels();

    for (const channel of channels) {
      const updated = this.updateMemberInChannel(channel, updatedMember);
      if (updated) {
        await this.saveChannelUpdates(channel);
      }
    }
  }

  updateMemberInChannel(channel: any, updatedMember: any): boolean {
    let updated = false;
    for (const member of channel.members) {
      if (member.id === updatedMember.uid) {
        member.name = updatedMember.name;
        member.imgUrl = updatedMember.imgUrl;
        if (member.role === 'admin') {
          channel.createdBy = updatedMember.name;
        }
        updated = true;
      }
    }
    return updated;
  }

  async saveChannelUpdates(channel: any): Promise<void> {
    const channelRef = doc(this.firestore, 'channels', channel.channelId);

    await updateDoc(channelRef, {
      members: channel.members,
      createdBy: channel.createdBy
    });
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
      this.putMessagesInArray(channelId);
    }
  }


  subChannel(channelId: string) {
    return onSnapshot(this.getChannelRef(channelId), (el) => {
      let channelData = el.data();
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
      const rawCreatedAt = ticketData['createdAt'];
      const rawLastThread = ticketData['lastThread'];
      const createdAtDate = rawCreatedAt instanceof Timestamp ? rawCreatedAt.toDate() : null;
      const lastThread = rawLastThread instanceof Timestamp ? rawLastThread.toDate() : null;
      const ticket: TicketInterface = {
        createdAt: createdAtDate,
        reactions: ticketData['reactions'],
        senderId: ticketData['senderId'],
        text: ticketData['text'],
        threadsCount: ticketData['threadsCount'],
        threads: this.getThreadRef(channelId, ticketId),
        lastThread: lastThread,
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


  async addTicketToChannel(channelId: string, senderId: string, text: string) {
    const newTicket: TicketInterface = {
      createdAt: serverTimestamp(),
      reactions: [],
      senderId: senderId,
      text: text,
      threadsCount: 0,
    };

    await addDoc(this.getNewMessageRef(channelId), newTicket)
  }

  async editTicketText(ticketRef: DocumentReference, text: string) {
    try {
      await updateDoc(ticketRef, { text: text })
    } catch (err) {
      console.error("The message could not be updated: ", err);
    }
  }

  renderThread(channelId: string, ticketId: string) {
    let threadRef = this.getThreadRef(channelId, ticketId);
  }

  async getThreadsCount(channelId: string, ticketId: string) {
    let threadRef = this.getThreadRef(channelId, ticketId);
    let snapshot = await getCountFromServer(threadRef)
    let threadsCount = snapshot.data().count

    return threadsCount
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

  updateChannelName(channelId: string, name: string) {
    const channelRef = doc(this.firestore, 'channels', channelId);     
    updateDoc(channelRef, {
      name
    })
  }

  updateChannelDescription(channelId: string, description: string) {
    const channelRef = doc(this.firestore, 'channels', channelId);     
    updateDoc(channelRef, {
      description
    })
  }

  async deleteMember(channelId: string, userProfile: any) {
    const channelRef = doc(this.firestore, 'channels', channelId);
    const docSnap = await getDoc(channelRef);

    if (docSnap.exists()) {
      const channelData = docSnap.data();
      const updatedMembers = (channelData['members'] || []).filter(
        (member: any) => member.id !== userProfile.uid
      );

      updateDoc(channelRef, {
        members: updatedMembers,
      });
    }
  }

  requestFocus() {
    this.focusRequest.next();
  }
}
