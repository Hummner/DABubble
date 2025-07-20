import { Timestamp, FieldValue } from 'firebase/firestore';

export interface Message {
  id?: string;
  createdAt?: Timestamp | FieldValue; // optional, because serverTimestamp() is a special FieldValue
  senderId: string;
  content: string;
  reactions?: string[];
}
