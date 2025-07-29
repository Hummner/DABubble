import { Injectable, inject, Input, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  setDoc
} from '@angular/fire/firestore';
import { DirectMessageService } from './direct-message.service';
import { Message } from '../interfaces/message.interface';
import { MessageService } from './message.service';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class ThreadDirectMessageService {
  private directMessageService = inject(DirectMessageService);
  private messageService = inject(MessageService);
  @Input() message!: Message;
  private _threadMessages$ = new BehaviorSubject<Message[]>([]);
  threadMessages$ = this._threadMessages$.asObservable();
  // unsubThreadMessages;

  constructor() {
    // this.unsubThreadMessages = this.subThreadList();
  }

  async addThreadMessage(item: Message, channelId: string, messageId:string) {
    const ref = this.getThreadMessagesRef(channelId,messageId);
    const docRef = await addDoc(ref, {
      senderId: item.senderId,
      content: item.content,
      createdAt: serverTimestamp(),
      reactions: item.reactions || [],
    });
    await setDoc(docRef, { id: docRef.id }, { merge: true });
  }

  subThreadList(channelId: string, docId: string) {
    return onSnapshot(
      this.getThreadMessagesRef(channelId, docId),
      (list) => {
        const threadMessages: Message[] = [];
        list.forEach((element) => {
          const msg = this.messageService.setMessageObject(element.data(), element.id);
          threadMessages.push(msg);
        });
        this._threadMessages$.next(threadMessages);
      }
    );
  }

    async updateThreadMessage(message: Message, docId: string, channelId: string, threadId:string) {
    if (!docId || !channelId) {
      console.error('Missing docId or channelId:', { docId, channelId });
      return;
    }
    if (message.id) {
      let ref = this.getSingleThreadRef(channelId, docId, threadId);
      await updateDoc(ref, this.messageService.getCleanJson(message)).catch((err) => {
        console.log(err);
      });
    }
  }

  async getThreadMessageById(channelId:string, messageId:string, threadId:string): Promise<Message | null>{
    const ref = this.getSingleThreadRef(channelId, messageId, threadId);
    const snap = await getDoc(ref);
    if(snap.exists()){
      return this.messageService.setMessageObject(snap.data(), snap.id)
    }
    return null;
  }

  getSingleThreadRef(channelId: string, docId: string, threadId:string){
    const threadMessageDocRef = doc(this.getThreadMessagesRef(channelId, docId), threadId);
    return threadMessageDocRef;
  }

  // ngOnDestroy(){
  //   this.unsubThreadMessages();
  // }

  getThreadMessagesRef(channelId: string, docId: string) {
    return collection(
      this.messageService.getSingleMessageRef(channelId, docId),
      'threadMessages'
    );
  }
}
