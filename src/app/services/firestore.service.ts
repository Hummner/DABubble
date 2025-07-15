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
import { user } from '@angular/fire/auth';
import { AuthService } from './auth.service';
import { UserProfileInterface } from '../interfaces/user-profile.interface';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService implements OnDestroy {
  private firestore = inject(Firestore);
  private auth = inject(AuthService);
  private user$ = user(this.auth.firebaseAuth);
  userList:UserProfileInterface[] = [];
  unsubUsers;

  userProfile: WritableSignal<UserProfileInterface | null> = signal(null);
  private unsubUserProfile?: () => void;

  constructor() {
    this.user$.subscribe((user) => {
      if (!user) {
        this.userProfile.set(null);
        this.unsubUserProfile?.();
        return;
      }

      this.unsubUserProfile?.();
      this.unsubUserProfile = this.subscribeToCurrentUser(user.uid);
    });
    this.unsubUsers = this.subUserList();
  }

  subUserList(){
    let ref = this.getUsersRef();
    return onSnapshot(ref, (list)=> {
      this.userList = [];
      list.forEach((element) => {
        this.userList.push(this.toUserProfile(element.data(), element.id))
      })
    })
  }

  ngOnDestroy() {
    this.unsubUserProfile?.();
    this.unsubUsers();
  }

  private subscribeToCurrentUser(uid: string) {
    const ref = doc(this.firestore, 'users', uid);
    return onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        const profile = this.toUserProfile(docSnap.data(), uid);
        this.userProfile.set(profile);
        console.log('Updated userProfile:', profile);
      }
    });
  }

  getUserId(): string {
    return this.auth.firebaseAuth.currentUser?.uid ?? '';
  }

  async addUserToDatabase(userData: UserProfileInterface, id: string) {
    await setDoc(doc(this.firestore, 'users', id), userData);
  }

  toUserProfile(source: any, uid: string): UserProfileInterface {
    return {
      uid,
      name: source.displayName || source.name || '',
      email: source.email || '',
      imgUrl: source.photoURL || source.imgUrl || '',
      createdAt:
        source.createdAt ||
        source.metadata?.createdAt ||
        new Date().toISOString(),
      isAnonymous: source.isAnonymous ?? false,
    };
  }

  getUsersRef() {
    return collection(this.firestore, 'users');
  }

  getSingleDoc(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }

  async updateUser(user: UserProfileInterface) {
    if (user.uid) {
      const docRef = this.getSingleDoc('users', user.uid);
      await updateDoc(docRef, this.getCleanJson(user)).catch((err) => {
        console.error('Error updating user:', err);
      });
    }
  }

  getCleanJson(user: UserProfileInterface): Partial<UserProfileInterface> {
    return {
      uid: user.uid,
      name: user.name,
      email: user.email,
      imgUrl: user.imgUrl,
      createdAt: user.createdAt,
      isAnonymous: user.isAnonymous,
    };
  }

  async getGuestLoginData(uid: string) {
    const data = {
      createdAt: new Date().toISOString(),
      role: 'guest',
      name: 'Guest',
      imgUrl: 'assets/img/profile.png',
      isAnonymous: true,
    };
    const userDoc = doc(this.firestore, `users/${uid}`);
    await setDoc(userDoc, data);
  }
}
