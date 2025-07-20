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
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { Timestamp } from 'firebase/firestore';

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
  });
  await setDoc(docRef, { id: docRef.id }, { merge: true });
}

  async updateMessage(message: Message, docId: string, channelId: string) {
    if (message.id) {
      let ref = this.getSingleMessageRef(channelId, docId);
      await updateDoc(ref, this.getCleanJson(message)).catch((err) => {
        console.log(err);
      });
    }
  }

  getCleanJson(message: Message): {} {
    return {
      id: message.id,
      createdAt: message.createdAt,
      senderId: message.senderId,
      content: message.content,
      reactions: message.reactions,
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
}
