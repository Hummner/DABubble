import { Timestamp, FieldValue } from '@angular/fire/firestore';

export interface Message {
  id?: string;
  createdAt?: Timestamp | FieldValue; 
  senderId: string;
  content: string;
  reactions?: string[];
  hasThread:boolean;
  threadCount:number;
}
