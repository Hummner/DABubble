import { Injectable, inject } from '@angular/core';
import { Message } from '../interfaces/message.interface';
import { Observable } from 'rxjs';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private firestore = inject(Firestore);
  messageList: Message[] = [];

  constructor() {}

  async addMessage(item: Message, docId: string) {
    await addDoc(this.getSubCollectionRef(docId), item)
      .catch((err) => {
        console.error(err);
      })
      .then((docRef) => {
        console.log('Document written with ID: ', docRef?.id);
      });
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
