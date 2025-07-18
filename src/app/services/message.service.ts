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
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private firestore = inject(Firestore);
  messageList: Message[] = [];

  constructor() {}

  async addMessage(item: Message, docId: string) {
    const docRef = await addDoc(this.getSubCollectionRef(docId), {
      ...item,
      id: '',
    }).catch((err) => {
      console.error(err);
    });
    if (docRef) {
      console.log('Document written with ID: ', docRef.id);
      const msgRef = docRef;
      await setDoc(msgRef, { id: docRef.id }, { merge: true });
    }
  }

  subList(channelId: string) {
    let ref = this.getSubCollectionRef(channelId);
    const q = query(ref, orderBy('createdAt'));
    return onSnapshot(q, (list) => {
      this.messageList = [];
      list.forEach((element) => {
        this.messageList.push(
          this.setMessageObject(element.data(), element.id)
        );
      });
    });
  }

  setMessageObject(obj: any, id: string) {
    return {
      id: id || '',
      createdAt: obj.createdAt || 0,
      senderId: obj.senderId || '',
      content: obj.content || '',
      reactions: obj.reactions || '',
    };
  }

  getSubCollectionRef(docId: string) {
    const docRef = this.getSingleDocRef(docId);
    return collection(docRef, 'messages');
  }

  getSingleDocRef(docId: string) {
    const singleDoc = doc(this.getCollectionRef(), docId);
    return singleDoc;
  }

  getCollectionRef() {
    return collection(this.firestore, 'directMessages');
  }
}
