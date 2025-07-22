import { Timestamp, FieldValue } from 'firebase/firestore';

export interface Message {
  id?: string;
  createdAt?: Timestamp | FieldValue; 
  senderId: string;
  content: string;
  reactions?: string[];
}
