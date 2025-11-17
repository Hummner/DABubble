import { inject, Injectable, signal } from '@angular/core';
import { Firestore, collection, doc, onSnapshot, query, where, getDocs, addDoc, orderBy } from '@angular/fire/firestore';
import { DirectMessageInterface } from '../interfaces/direct-message.interface';
import { UserProfileInterface } from '../interfaces/user-profile.interface';
import { FirestoreService } from './firestore.service';
import { user } from '@angular/fire/auth';
@Injectable({
  providedIn: 'root',
})
export class DirectMessageService {
  private firestore = inject(Firestore);
  private userIdsSignal = signal<string[]>([]);
  readonly userIds = this.userIdsSignal;
  public currentUserProfile = signal<UserProfileInterface | null>(null);
  public secondUserProfile = signal<UserProfileInterface | null>(null);
  private unsubDMList?: () => void;
  private unsubUserProfile?: () => void;

  constructor(private firestoreService: FirestoreService) {}

  async getDMChannel(currentUserId: string, clickedUserId: string): Promise<string> {
    const sortedIds = [currentUserId, clickedUserId].sort();
    const q = query(this.getDirectMessageChannelListRef(), where('users', '==', sortedIds));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }
    const docRef = await addDoc(this.getDirectMessageChannelListRef(), {
      users: sortedIds,
    });
    return docRef.id;
  }

  private subUserProfile(uid: string) {
    this.unsubUserProfile?.();
    this.unsubUserProfile = this.firestoreService.subUserList((users) => {
      const secondUser = users.find((user) => user.uid === uid);
      if (secondUser) this.secondUserProfile.set(secondUser);
    });
  }

  subDirectMessageChannel(docId: string, currentUserId: string, handleData?: (data: any) => void): () => void {
    const ref = this.getSingleDirectMessageChannelRef('directMessages', docId);
    const unsubSingle = onSnapshot(ref, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        this.processDMData(data, currentUserId);
        handleData?.(data);
      }
    });
    return unsubSingle;
  }

  processDMData(data: any, currentUserId: string) {
    const users = data['users'] || [];
    this.userIdsSignal.set(users);
    const secondUser = users.find((uid: string) => uid !== currentUserId);
    if (users[0] === users[1]) {
      this.subUserProfile(users[1]);
    } else {
      this.subUserProfile(secondUser);
    }
  }

  subDMList(handleData?: (dmList: DirectMessageInterface[]) => void): () => void {
    const ref = this.getDirectMessageChannelListRef();
    const q = query(ref, orderBy('createdAt'));
    const unsubList = onSnapshot(q, (snapshot) => {
      const dmList: DirectMessageInterface[] = [];
      snapshot.forEach((docSnap) => {
        dmList.push(this.setDMObject(docSnap.data(), docSnap.id));
      });
      handleData?.(dmList);
    });
    return unsubList;
  }

  setDMObject(data: any, id: string): DirectMessageInterface {
    return {
      id: id,
      users: data.users || [],
    };
  }

  ngOnDestroy(): void {
    this.unsubDMList?.();
    this.unsubUserProfile?.();
  }

  getDirectMessageChannelListRef() {
    return collection(this.firestore, 'directMessages');
  }

  getSingleDirectMessageChannelRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }

  async getAllDirectMessages() {
    const directMessagesCol = collection(this.firestore, 'directMessages');
    const snapshot = await getDocs(directMessagesCol);
    const directMessages = snapshot.docs.map(doc => ({
      directMessagesId: doc.id,
      users: doc.data()['users'] || [],
      ...doc.data()
    }));
    return directMessages;
  }
}
