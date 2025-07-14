import { Injectable, inject, OnDestroy } from '@angular/core';
import {
  Firestore,
  collection,
  onSnapshot,
  Unsubscribe
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { NavbarInterface } from '../interfaces/navbar.interface';

@Injectable({ providedIn: 'root' })
export class NavbarService implements OnDestroy {
  private fs = inject(Firestore);
  private stop!: Unsubscribe;

  /** Live‑Stream der Channels */
  private channels$ = new BehaviorSubject<NavbarInterface[]>([]);
  channelsObs$ = this.channels$.asObservable();

  constructor() {
    const colRef = collection(this.fs, 'channels');
    this.stop = onSnapshot(colRef, snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() } as NavbarInterface));
      this.channels$.next(arr);
    });
  }

  ngOnDestroy() {
    this.stop?.();
  }
}
