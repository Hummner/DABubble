import { inject, signal, WritableSignal } from '@angular/core';
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  setDoc,
  doc,
  onSnapshot,
} from '@angular/fire/firestore';
import { user } from '@angular/fire/auth';
import { AuthService } from './auth.service';
import { UserProfileInterface } from '../interfaces/user-profile.interface';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  firestore = inject(Firestore);
  auth = inject(AuthService);
  user$ = user(this.auth.firebaseAuth);
  userId?: string;

  userProfile: WritableSignal<UserProfileInterface | null> = signal(null);
  unsubUserProfile?: () => void;

  constructor() {
    user(this.auth.firebaseAuth).subscribe((user) => {
      if (!user) {
        this.userProfile.set(null);
        this.unsubUserProfile?.();
        return;
      }
      this.unsubUserProfile?.();
      this.unsubUserProfile = this.subscribeToCurrentUser(user.uid);
    });
  }

  subscribeToCurrentUser(uid: string) {
    if (!uid) return;
    const ref = doc(this.firestore, 'users', uid);
    return onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        const profile = this.setUserInfoObject(docSnap.data(), uid);
        this.userProfile.set(profile);
        console.log('Updated userProfile:', profile);
      }
    });
  }

  ngOnDestroy() {
    if (this.unsubUserProfile) {
      this.unsubUserProfile();
    }
  }

  getUserId(): string {
    this.userId = this.auth.firebaseAuth.currentUser?.uid;
    return this.userId!;
  }

  async addUserToDatabase(userData: any, id: string) {
    await setDoc(doc(this.firestore, 'users', id), userData);
    console.log(userData);
  }

  setUserProfileObject(obj: any, id: string): UserProfileInterface {
    return {
      uid: id || '',
      name: obj.displayName || '',
      email: obj.email || '',
      imgUrl: obj.photoURL || '',
      createdAt: obj.metadata.createdAt || '',
      isAnonymous: false,
    };
  }

  setUserInfoObject(obj: any, id: string): UserProfileInterface {
    return {
      uid: id,
      name: obj.name,
      email: obj.email || '',
      imgUrl: obj.imgUrl || '',
      createdAt: obj.createdAt || '',
      isAnonymous: false,
    };
  }

  getUsersRef() {
    console.log(collection(this.firestore, 'users'));
    return collection(this.firestore, 'users');
  }

  getSingleDoc(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }
}
