import { Injectable, inject, OnDestroy, computed } from '@angular/core';
import { Firestore, collection, onSnapshot, Unsubscribe, doc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { NavbarInterface } from '../interfaces/navbar.interface';
import { ChannelsService } from '../services/channels.service';
import { DirectMessageService } from '../services/direct-message.service';
import { FirestoreService } from '../services/firestore.service';
import { UserProfileInterface } from '../interfaces/user-profile.interface';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { user } from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class NavbarService implements OnDestroy {
  private firestore = inject(Firestore);
  private stop!: Unsubscribe;
  userProfile = this.firestoreService.userProfile;
  private channels$ = new BehaviorSubject<NavbarInterface[]>([]);
  channelsObs$ = this.channels$.asObservable();
  private channelService = inject(ChannelsService);
  private router = inject(Router);

  private standardChannelInitialized = false;
  private selectedChannelId$ = new BehaviorSubject<string | null>(null);
  selectedChannelIdObs$ = this.selectedChannelId$.asObservable();
  readonly channelUsers = this.directMessageService.userIds;
  readonly currentUserId = computed(() => this.userProfile()?.uid);
  readonly selectedUserId = computed(() => {
    const users = this.channelUsers();
    const current = this.currentUserId();
    const other = users.find(uid => uid !== current);
    const self = users.every(uid => uid === users[0]);
    this.clearSelectedChannelId();
    if (!users || !current) return null;
    if (other) return other;
    return self ? users[0] : null;
  });

  constructor(
    private firestoreService: FirestoreService,
    private directMessageService: DirectMessageService,
  ) {
    const colRef = collection(this.firestore, 'channels');
    this.stop = onSnapshot(colRef, snap => {
      const arr = snap.docs.map(d => ({ ...d.data() } as NavbarInterface));
      this.channels$.next(arr);
    });
  }

  ngOnDestroy() {
    this.stop?.();
  }

  selectChannel(channelId: string) {
    this.nextSelectedChannelId(channelId);
    this.channelService.getChannel(channelId);
    this.router.navigateByUrl(`channel/${channelId}`);
    this.focusOnChannelTextarea();
  }

  hideChannelWithoutCurrentUser() {
    const filteredChannels$ = this.channelsObs$.pipe(
      map(channels =>
        channels.filter(channel =>
          (channel.members ?? []).some(
            member => member.id === this.currentUserId()
          )
        )
      )
    );
    return filteredChannels$
  }

  nextSelectedChannelId(channelId: string) {
    this.selectedChannelId$.next(channelId);
  }

  getSelectedChannelId() {
    return this.selectedChannelId$.value;
  }

  clearSelectedChannelId() {
    this.selectedChannelId$.next(null);
  }

  focusOnChannelTextarea() {
    this.channelService.requestFocus();
  }

  getOtherUserList(): UserProfileInterface[] {
    const users = this.firestoreService.userList();
    this.ensureStandardChannelMembersInitialized(users);

    return users.filter((user) => user.uid !== this.userProfile()?.uid);
  }

  async findOrCreateDMchannel(currentUserId: string, clickedUserId: string) {
    const channelId = await this.directMessageService.getDMChannel(
      currentUserId,
      clickedUserId
    );
    this.router.navigateByUrl(`directMessages/${channelId}`);
    this.directMessageService.subDirectMessageChannel(channelId, currentUserId);
  }

  ensureStandardChannelMembersInitialized(users: UserProfileInterface[]) {
    if (!this.standardChannelInitialized && users.length > 0) {
      this.standardChannelInitialized = true;
      this.addAllMembersToStandardChannel(users);
    }
  }

  addAllMembersToStandardChannel(users: UserProfileInterface[]) {
    const members = users.map((user) => ({
      id: user.uid,
      role: user.uid === this.userProfile()?.uid ? 'admin' : 'member',
      name: user.name,
      imgUrl: user.imgUrl
    }));
    this.updateStandardChannel(members);
  }

  updateStandardChannel(members: any) {
    const standardChannelId = 'oXAdebNL8QaqXWNrvULn'
    const channelRef = doc(this.firestore, 'channels', standardChannelId);

    updateDoc(channelRef, {
      members: arrayUnion(...(members || [])),
      channelId: standardChannelId
    })
  }
}
