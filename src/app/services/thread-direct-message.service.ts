import { Injectable, inject, Input } from '@angular/core';
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
@Injectable({
  providedIn: 'root',
})
export class ThreadDirectMessageService {
  private directMessageService = inject(DirectMessageService);
  private messageService = inject(MessageService)
  @Input() message!: Message;
  messages = this.messageService.messageList$;

  constructor() {}


}
