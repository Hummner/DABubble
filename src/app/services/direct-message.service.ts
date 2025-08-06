import { inject, Injectable, OnDestroy, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
} from '@angular/fire/firestore';
import { DirectMessageInterface } from '../interfaces/direct-message.interface';
import { UserProfileInterface } from '../interfaces/user-profile.interface';
import { FirestoreService } from './firestore.service';
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

  //we need to find the channel id, which exists between the current user and user I clicked on
  //if there is an existing one (already opened), it searches for it, if not, then creates a new one
  async getDMChannel(
    currentUserId: string,
    clickedUserId: string
  ): Promise<string> {
    const q = query(
      this.getDirectMessageChannelListRef(),
      where('users', 'array-contains', currentUserId)
    );
    const snapshot = await getDocs(q);
    const existingDoc = snapshot.docs.find((doc) =>
      doc.data()['users'].includes(clickedUserId)
    );
    if (existingDoc) return existingDoc.id;
    const docRef = await addDoc(this.getDirectMessageChannelListRef(), {
      users: [currentUserId, clickedUserId],
    });
    return docRef.id;
  }

  private subUserProfile(uid: string) {
    this.unsubUserProfile?.();
    this.unsubUserProfile = this.firestoreService.subUserList((users) => {
      const secondUser = users.find((user) => user.uid === uid);
      if (secondUser) {
        this.secondUserProfile.set(secondUser);
      }
    });
  }

  subDirectMessageChannel(
    docId: string,
    currentUserId: string,
    handleData?: (data: any) => void
  ): () => void {
    const ref = this.getSingleDirectMessageChannelRef('directMessages', docId);
    const unsubSingle = onSnapshot(ref, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        const users = data['users'] || [];
        this.userIdsSignal.set(users);
        const secondUser = users.find((uid: string) => uid !== currentUserId);
        if (secondUser) {
          this.subUserProfile(secondUser);
        }
        handleData?.(data);
      }
    });
    return unsubSingle;
  }

  subDMList(
    handleData?: (dmList: DirectMessageInterface[]) => void
  ): () => void {
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
}
