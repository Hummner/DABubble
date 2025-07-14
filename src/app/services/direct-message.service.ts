import { DirectMessageInterface } from '../interfaces/direct-message.interface';
import { inject, signal, WritableSignal } from '@angular/core';
import { Injectable, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  setDoc,
  doc,
  onSnapshot,
  updateDoc,
} from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root',
})
export class DirectMessageService {
  private firestore = inject(Firestore);
  directMessageList: DirectMessageInterface[] = [];
  directMessage!: DirectMessageInterface;
  unsubSingleDM;

  constructor() {
    this.unsubSingleDM = this.subSingleDM();
  }

  subSingleDM() {
    return onSnapshot(
      this.getSingleDMRef('directMessages', 'JAmtF5YXnkAQbUteE2l1'),
      () => {}
    );
  }

  getDMListRef() {
    return collection(this.firestore, 'directMessages');
  }
  getSingleDMRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }
}
