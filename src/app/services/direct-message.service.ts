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
} from '@angular/fire/firestore';
import { DirectMessageInterface } from '../interfaces/direct-message.interface';

@Injectable({
  providedIn: 'root',
})
export class DirectMessageService {
  private firestore = inject(Firestore);
  private userIdsSignal = signal<string[]>([]);
  readonly userIds = this.userIdsSignal; 
  private unsubDMList?: () => void;
  constructor() {}

  //we need to find the channel id, which exists between the current user and user I clicked on
  //if there is an existing one (already opened), it searches for it, if not, then creates a new one
  async getDMChannel(
    currentUserId: string,
    clickedUserId: string
  ): Promise<string> {
    const q = query(
      this.getDMListRef(),
      where('users', 'array-contains', currentUserId)
    );
    const snapshot = await getDocs(q);
    const existingDoc = snapshot.docs.find((doc) => {
      const users = doc.data()['users'];
      return users.includes(clickedUserId);
    });
    if (existingDoc) {
      return existingDoc.id;
    } else {
      const docRef = await addDoc(this.getDMListRef(), {
        users: [currentUserId, clickedUserId],
      });
      return docRef.id;
    }
  }

  subSingleDM(docId: string, handleData?: (data: any) => void): () => void {
    const ref = this.getSingleDMRef('directMessages', docId);
    const unsubSingle = onSnapshot(ref, (snapshot) => {
      const data = snapshot.data();
      if (data) {
        const users = data['users'] || [];
        this.userIdsSignal.set(users); // ✅ set signal value
        handleData?.(data);
      }
    });
    return unsubSingle;
  }

  subDMList(
    handleData?: (dmList: DirectMessageInterface[]) => void
  ): () => void {
    const ref = this.getDMListRef();
    const unsubList = onSnapshot(ref, (snapshot) => {
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

  getCleanJson(dm: DirectMessageInterface): Partial<DirectMessageInterface> {
    return {
      id: dm.id,
      users: dm.users,
    };
  }

  ngOnDestroy(): void {
    this.unsubDMList?.();
  }

  getDMListRef() {
    return collection(this.firestore, 'directMessages');
  }

  getSingleDMRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }
}
