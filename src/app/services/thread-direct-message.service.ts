import { Injectable, inject, Input, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
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
