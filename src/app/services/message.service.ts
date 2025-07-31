import { Injectable, inject } from '@angular/core';
import { Message } from '../interfaces/message.interface';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  query,
  addDoc,
  orderBy,
  setDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private firestore = inject(Firestore);
  private messageListSubject = new BehaviorSubject<Message[]>([]);
  messageList$ = this.messageListSubject.asObservable();

  private internalList: Message[] = [];

  constructor() {}

  async addMessage(item: Message, docId: string) {
    const ref = this.getSubCollectionRef(docId);
    const docRef = await addDoc(ref, {
      senderId: item.senderId,
      content: item.content,
      createdAt: serverTimestamp(),
      reactions: item.reactions || [],
      hasThread: item.hasThread || false,
      threadCount: item.threadCount || 0,
    });
    await setDoc(docRef, { id: docRef.id }, { merge: true });
  }

  async updateMessage(message: Message, docId: string, channelId: string) {
    if (!docId || !channelId) {
      console.error('Missing docId or channelId:', { docId, channelId });
      return;
    }
    if (docId) {
      let ref = this.getSingleMessageRef(channelId, docId);
      await updateDoc(ref, this.getCleanJson(message)).catch((err) => {
        console.log(err);
      });
    }
  }

  async updateMessagePartial(
    partialData: Partial<Message>,
    docId: string,
    channelId: string
  ) {
    if (!docId || !channelId) {
      console.error('Missing docId or channelId:', { docId, channelId });
      return;
    }
    const ref = this.getSingleMessageRef(channelId, docId);
    try {
      await updateDoc(ref, partialData);
    } catch (err) {
      console.error('Partial update failed:', err);
    }
  }

  async getMessageById(
    channelId: string,
    messageId: string
  ): Promise<Message | null> {
    const ref = this.getSingleMessageRef(channelId, messageId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return this.setMessageObject(snap.data(), snap.id);
    }
    return null;
  }

  getCleanJson(message: Message): {} {
    return {
      id: message.id,
      createdAt: message.createdAt,
      senderId: message.senderId,
      content: message.content,
      reactions: message.reactions,
      hasThread: message.hasThread,
      threadCount: message.threadCount,
    };
  }

  subList(channelId: string) {
    const ref = this.getSubCollectionRef(channelId);
    const q = query(ref, orderBy('createdAt'));
    return onSnapshot(q, (list) => {
      const newList: Message[] = [];
      list.forEach((element) => {
        newList.push(this.setMessageObject(element.data(), element.id));
      });
      this.internalList = newList;
      this.messageListSubject.next(newList);
    });
  }

  getCurrentMessages(): Message[] {
    return this.internalList;
  }

  setMessageObject(obj: any, id: string) {
    return {
      id,
      createdAt: obj.createdAt ?? obj.clientCreatedAt ?? null,
      senderId: obj.senderId || '',
      content: obj.content || '',
      reactions: obj.reactions || [],
      hasThread: obj.hasThread || false,
      threadCount: obj.threadCount || 0,
    };
  }

  getSingleMessageRef(channelId: string, docId: string) {
    const messageDocRef = doc(this.getSubCollectionRef(channelId), docId);
    return messageDocRef;
  }

  getSubCollectionRef(channelId: string) {
    const docRef = this.getSingleDocRef(channelId);
    return collection(docRef, 'messages');
  }

  getSingleDocRef(channelId: string) {
    const singleDoc = doc(this.getCollectionRef(), channelId);
    return singleDoc;
  }

  getCollectionRef() {
    return collection(this.firestore, 'directMessages');
  }

  //Firebase creates Timestamp - realdate/time value, it has a method ".toDate()"
  //which converts it to native JavaScript Date Object
  //when we fetch a message, createdAt filed value will be a Timestamp
  //FieldValue it not a real date/time value, it is a placeholder used ONLY when writing to Firestore
  //serverTimestamp() returns a FieldValue
  //  - and Firestore replace this with actual Timestamp when the document is written on the server
  //we chack first if -date- has a "toDate method", when yes, then it converts to JavaScript date
  formatDateLabel(date: Date | Timestamp): string {
    if ('toDate' in date) {
      date = date.toDate();
    }
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    if (isToday) {
      return 'Heute';
    }
    const weekday = date.toLocaleDateString('de-DE', { weekday: 'long' });
    const formattedDate = date.toLocaleDateString('de-DE');
    return `${weekday}, ${formattedDate}`;
  }

  isTimestamp(value: any): value is Timestamp {
    return value && typeof value.toDate === 'function';
  }

  getMessagesGroupedByDate(messageArr: any[]): { [date: string]: Message[] } {
    return messageArr.reduce((groups, message) => {
      const createdAt = message.createdAt;
      if (!this.isTimestamp(createdAt)) {
        return groups;
      }
      const dateStr = this.formatDateLabel(createdAt);
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(message);

      return groups;
    }, {} as { [date: string]: Message[] });
  }
}
