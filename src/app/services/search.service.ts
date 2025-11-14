import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, query, orderBy, CollectionReference, doc, getDoc } from '@angular/fire/firestore';
import { FirestoreService } from './firestore.service';
import { ChannelsService } from './channels.service';
import { UserProfileInterface } from '../interfaces/user-profile.interface';
import { AuthService } from './auth.service';
import { DirectMessageService } from './direct-message.service';
import { Router } from '@angular/router';
import { NavbarService } from './navbar.service';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  isLoading = false;
  filteredChannels: any[] = [];
  filteredMessages: any[] = [];
  noResultsMessage: string = '';
  filteredUsers: UserProfileInterface[] = [];
  members: { id: string; role: string; name: string; imgUrl: string }[] = [];
  searchText = '';
  private firestore = inject(Firestore);
  private firestoreService = inject(FirestoreService);
  private channelService = inject(ChannelsService);
  private directMessageService = inject(DirectMessageService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private navbarService = inject(NavbarService);

  constructor() {}

  async onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchText = value;

    const result = await this.search(this.searchText);

    this.filteredUsers = result.users;
    this.filteredChannels = result.channels;
    this.filteredMessages = result.messages;
    this.noResultsMessage = result.noResultsMessage;
  }

  async search(searchText: string) {
    const searchTextTrimmed = searchText.trim();
    this.searchTextEmpty(searchTextTrimmed);
    
    return this.setSearchPath(searchTextTrimmed, this.members);
  }

  searchTextEmpty(searchTextTrimmed: string): any {
    if (!searchTextTrimmed && searchTextTrimmed === '') {
      return { users: [], channels: [], messages: [], noResultsMessage: '' };
    }
  }

  async setSearchPath(searchTextTrimmed: string, members: { id: string }[]) {
    const channels = await this.channelService.getAllChannels();
    const directMessages = await this.directMessageService.getAllDirectMessages();

    return this.handleSearchType(searchTextTrimmed, members, channels, directMessages);
  }

  handleSearchType(searchTextTrimmed: string, members: { id: string }[], channels: any[], directMessages: any[]) {
    if (searchTextTrimmed.startsWith('@')) {
      return this.searchForUsers(searchTextTrimmed.slice(1), members);
    } else if (searchTextTrimmed.startsWith('#')) {
      return this.searchForChannels(searchTextTrimmed.slice(1), channels);
    } else if (searchTextTrimmed.length > 2) {
      this.isLoading = true;
      return this.searchForMessages(searchTextTrimmed.toLowerCase(), channels, directMessages);
    } else if (this.isTooShortAndNotPrefixed(searchTextTrimmed)) {
      return this.toFewLetters();
    }

    return { users: [], channels: [], messages: [], noResultsMessage: '' };
  }

  searchForUsers(searchText: string, members: { id: string }[]) {
    const users = this.firestoreService
      .userList()
      .filter((user) => user.name.toLowerCase().includes(searchText.toLowerCase()) && !members.find((m) => m.id === user.uid));
    return {
      users,
      channels: [],
      messages: [],
      noResultsMessage: users.length === 0 ? 'Kein Benutzer gefunden.' : '',
    };
  }

  searchForChannels(searchText: string, channels: any[]) {
    const filtered = channels.filter((channel) => channel.name.toLowerCase().includes(searchText.toLowerCase()));
    return {
      users: [],
      channels: filtered,
      messages: [],
      noResultsMessage: filtered.length === 0 ? 'Kein Channel gefunden.' : '',
    };
  }

  async searchForMessages(searchText: string, channels: any[], directMessages: any[]) {
    const currentUserId = this.auth.firebaseAuth.currentUser?.uid ?? null;
    const userChannels = channels.filter((channel) => channel.members.some((member: any) => member.id === currentUserId));
    const userDMs = directMessages.filter((dm: any) => dm.users.includes(currentUserId));
    const channelMessagesResults = await this.mapAllChannelMessages(userChannels);
    const dmMessagesResults = await this.mapAllDirectMessages(userDMs);

    const filteredMessages = await this.sortAllMessages(channelMessagesResults, dmMessagesResults, searchText);

    return this.noFilteredMessagesFound(filteredMessages);
  }

  isTooShortAndNotPrefixed(text: string) {
    return (!text.startsWith('@') && !text.startsWith('#')) && text.length <= 2 && text.length > 0;
  }

  toFewLetters() {
    return {
      users: [],
      channels: [],
      messages: [],
      noResultsMessage: 'Bitte geben sie mindestens drei Buchstaben ein.',
    };
  }

  noFilteredMessagesFound(filteredMessages: any[]) {
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
    
    return {
      users: [],
      channels: [],
      messages: filteredMessages,
      noResultsMessage: filteredMessages.length === 0 ? 'Keine Nachrichten gefunden.' : '',
    };
  }

  async sortAllMessages(channelMessagesResults: any = [], dmMessagesResults: any = [], searchText: string = '') {
    let filteredMessages: any[] = [];
    filteredMessages = await this.filterAllMessages(channelMessagesResults, dmMessagesResults, searchText);
    filteredMessages = this.removeDuplicates(filteredMessages);
    this.sortMessagesByTimestamp(filteredMessages);
    return filteredMessages;
  }

  async filterAllMessages(channelMessagesResults: any = [], dmMessagesResults: any = [], searchText: string = '') {
    return this.filteredMessages = [
      ...await this.filterChannelMessages([], channelMessagesResults, searchText),
      ...await this.filterDirectMessages([], dmMessagesResults, searchText),
    ];
  }

  async filterChannelMessages(filteredMessages: any, channelMessagesResults: any, searchText: string) {
    for (const { channelId, messages } of channelMessagesResults) {
      const filtered = messages.filter((m: any) => m.text.toLowerCase().includes(searchText.toLowerCase()));
      filteredMessages.push(...filtered);

      const threadPromises = messages.map((msg: any) => this.getThreadMessages(channelId, msg.id));
      const threadResults = await Promise.all(threadPromises);
      for (const threadMsgs of threadResults) {
        const filteredThreads = threadMsgs.filter((m: any) => m.text.toLowerCase().includes(searchText.toLowerCase()));
        filteredMessages.push(...filteredThreads);
      }
    }
    return filteredMessages;
  }

  async filterDirectMessages(filteredMessages: any, dmMessagesResults: any, searchText: string) {
    for (const { directMessagesId, messages } of dmMessagesResults) {
      const filtered = messages.filter((m: any) => m.text.toLowerCase().includes(searchText.toLowerCase()));
      filteredMessages.push(...filtered);

      const threadPromises = messages.map((msg: any) => this.getThreadDMessages(directMessagesId, msg.id));
      const threadResults = await Promise.all(threadPromises);
      for (const threadMsgs of threadResults) {
        const filteredThreads = threadMsgs.filter((m:any) => m.text.toLowerCase().includes(searchText.toLowerCase()));
        filteredMessages.push(...filteredThreads);
      }
    }
    return filteredMessages;
  }

  async getMessagesFromCollection(colRef: CollectionReference): Promise<any[]> {
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const allUsers = this.firestoreService.userList();
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const createdAt = doc.data()['createdAt']?.toDate();
      return this.returnSnapshotData(createdAt, doc, allUsers);
    });
  }

  returnSnapshotData(createdAt: Date | null, doc: any, allUsers: any) {
    return {
      id: doc.id,
      text: doc.data()['text'] || doc.data()['content'] || '',
      userId: doc.data()['senderId'],
      timestamp: createdAt ? createdAt.getTime() : 0,
      userName: allUsers.find((u: any) => u.uid === doc.data()['senderId'])?.name || 'Unknown',
    };
  }

  async mapAllChannelMessages(userChannels: any[]) {
    return Promise.all(
      userChannels.map(async (channel) => ({
        channelId: channel.channelId,
        messages: await this.getChannelMessages(channel.channelId),
      }))
    );
  }

  async mapAllDirectMessages(userDMs: any[]) {
    return Promise.all(
      userDMs.map(async (dm) => ({
        directMessagesId: dm.directMessagesId,
        messages: await this.getDirectMessages(dm.directMessagesId),
      }))
    )
  }

  getChannelMessages(channelId: string): Promise<any[]> {
    const colRef = collection(this.firestore, 'channels', channelId, 'messages');
    return this.getMessagesFromCollection(colRef);
  }

  getThreadMessages(channelId: string, messageId: string): Promise<any[]> {
    const colRef = collection(this.firestore, 'channels', channelId, 'messages', messageId, 'threads');
    return this.getMessagesFromCollection(colRef);
  }

  getDirectMessages(directMessageId: string): Promise<any[]> {
    const colref = collection(this.firestore, 'directMessages', directMessageId, 'messages');
    return this.getMessagesFromCollection(colref);
  }

  getThreadDMessages(directMessageId: string, messageId: string): Promise<any[]> {
    const colref = collection(this.firestore, 'directMessages', directMessageId, 'messages', messageId, 'threadMessages');
    return this.getMessagesFromCollection(colref);
  }

  removeDuplicates(messages: any[]) {
    return messages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id && m.text === message.text)
    );
  }

  sortMessagesByTimestamp(messages: any[]) {
    return messages.sort((a, b) => b.timestamp - a.timestamp);
  }

  async selectMessage(messageId: string) {
    this.isLoading = true;
    const allChannels = await this.channelService.getAllChannels();
    const allDirectMessages = await this.directMessageService.getAllDirectMessages();

    this.foundMessageInChannel(allChannels, messageId);
    this.foundMessageInDM(allDirectMessages, messageId);
  }

  async foundMessageInChannel(allChannels: any[], messageId: string) {
    const foundInChannel = await this.findMessageInChannels(allChannels, messageId);
    if (foundInChannel) {
      return;
    }
  }

  async foundMessageInDM(allDirectMessages: any[], messageId: string) {
    const foundInDM = await this.findMessageInDirectMessages(allDirectMessages, messageId);
    if (foundInDM) {
      return;
    }
  }

  async findMessageInChannels(channels: any[], messageId: string): Promise<boolean> {
    const checks = channels.map(c => this.checkChannel(c.channelId, messageId));
    return (await Promise.all(checks)).some(found => found);
  }

  async checkChannel(channelId: string, messageId: string): Promise<boolean> {
    if (await this.navigateIfChannelMessageExists(channelId, messageId)) {
      return true;
    }
    return this.navigateIfChannelThreadExists(channelId, messageId) 
  }

  async findMessageInDirectMessages(dms: any[], messageId: string): Promise<boolean> {
    const checks = dms.map(dm => this.checkDirectMessage(dm.directMessagesId, messageId));
    return (await Promise.all(checks)).some(found => found);
  }

  async checkDirectMessage(dmId: string, messageId: string): Promise<boolean> {
    if (await this.navigateIfDirectMessageExists(dmId, messageId)) {
      return true;
    }
    return this.navigateIfDirectThreadExists(dmId, messageId);
  }
  
  async navigateIfChannelMessageExists(channelId: string, messageId: string): Promise<boolean> {
    const ref = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      this.isLoading = false;
      this.searchText = '';
      this.channelService.getChannel(channelId);
      this.router.navigateByUrl(`channel/${channelId}`);
      this.navbarService.nextSelectedChannelId(channelId);
      return true;
    }
    return false;
  }

  async navigateIfChannelThreadExists(channelId: string, messageId: string): Promise<boolean> {
    const messagesRef = collection(this.firestore, 'channels', channelId, 'messages');
    const snapshot = await getDocs(messagesRef);

    for (const msg of snapshot.docs) {
      const ref = doc(this.firestore, `channels/${channelId}/messages/${msg.id}/threads/${messageId}`);
      const snap = await getDoc(ref);
      if (this.handleSnapIfExists(snap, 'channel', channelId, messageId, msg)) {
        this.navbarService.nextSelectedChannelId(channelId);
        return true;
      };
    }
    return false;
  }

  async navigateIfDirectMessageExists(dmId: string, messageId: string): Promise<boolean> {
    const ref = doc(this.firestore, `directMessages/${dmId}/messages/${messageId}`);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      this.isLoading = false;
      this.searchText = '';
      this.router.navigate(['directMessages', dmId, 'messages', messageId]);
      return true;
    }
    return false;
  }

  async navigateIfDirectThreadExists(dmId: string, messageId: string): Promise<boolean> {
    const messagesRef = collection(this.firestore, 'directMessages', dmId, 'messages');
    const snapshot = await getDocs(messagesRef);

    for (const msg of snapshot.docs) {
      const ref = doc(this.firestore, `directMessages/${dmId}/messages/${msg.id}/threadMessages/${messageId}`);
      const snap = await getDoc(ref);
      if (this.handleSnapIfExists(snap, 'directMessages', dmId, messageId, msg)) {
        return true;
      };
    }
    return false;
  }

  handleSnapIfExists(snap: any, direction: string, directionId: string, messageId: string, msg: any): boolean {
    if (snap.exists()) {
      this.isLoading = false;
      this.searchText = '';
      this.router.navigate([direction, directionId, 'messages', msg.id], {
        queryParams: { threadMessageId: messageId },
      });
      return true;
    }
    return false;
  }
}
