import { inject } from '@angular/core';
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  firestore = inject(Firestore);
  userId?: string;

  constructor(private auth: AuthService) {}

  async queryUser() {
    const q = query(
      collection(this.firestore, 'users'),
      where('uid', '==', this.getUserId())
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      console.log(doc.id, doc.data());
    });
  }

  getUserId(): string {
    this.userId = this.auth.firebaseAuth.currentUser?.uid;
    return this.userId!;
  }
}
