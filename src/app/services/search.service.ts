import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, query, orderBy, CollectionReference, doc, getDoc } from '@angular/fire/firestore';
import { FirestoreService } from './firestore.service';
import { ChannelsService } from './channels.service';
import { UserProfileInterface } from '../interfaces/user-profile.interface';
import { AuthService } from './auth.service';
import { DirectMessageService } from './direct-message.service';
import { Router } from '@angular/router';

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

  constructor() {}

  async onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchText = value;

    const result = await this.search(this.searchText, this.members);

    this.filteredUsers = result.users;
    this.filteredChannels = result.channels;
    this.filteredMessages = result.messages;
    this.noResultsMessage = result.noResultsMessage;
  }
  async search(searchText: string, members: { id: string }[]) {
    const searchTextTrimmed = searchText.trim();
    if (!searchTextTrimmed && searchTextTrimmed === '') {
      return { users: [], channels: [], messages: [], noResultsMessage: '' };
    }

    const channels = await this.channelService.getAllChannels();
    const directMessages = await this.directMessageService.getAllDirectMessages();

    if (searchTextTrimmed.startsWith('@')) {
      return this.searchForUsers(searchTextTrimmed.slice(1), members);
    } else if (searchTextTrimmed.startsWith('#')) {
      return this.searchForChannels(searchTextTrimmed.slice(1), channels);
    } else if (searchTextTrimmed.length > 2) {
      return this.searchForMessages(searchTextTrimmed.toLowerCase(), channels, directMessages);
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

    const channelMessagesPromises = userChannels.map((channel) =>
      this.getChannelMessages(channel.channelId).then((messages) => ({
        channelId: channel.channelId,
        messages,
      }))
    );
    const channelMessagesResults = await Promise.all(channelMessagesPromises);

    const dmMessagesPromises = userDMs.map((dm) =>
      this.getDirectMessages(dm.directMessagesId).then((messages) => ({
        directMessagesId: dm.directMessagesId,
        messages,
      }))
    );
    const dmMessagesResults = await Promise.all(dmMessagesPromises);

    let filteredMessages: any[] = [];

    for (const { directMessagesId, messages } of dmMessagesResults) {
      const filtered = messages.filter((m) => m.text.toLowerCase().includes(searchText.toLowerCase()));
      filteredMessages.push(...filtered);

      const threadPromises = messages.map((msg) => this.getThreadDMessages(directMessagesId, msg.id));
      const threadResults = await Promise.all(threadPromises);

      for (const threadMsgs of threadResults) {
        const filteredThreads = threadMsgs.filter((m) => m.text.toLowerCase().includes(searchText.toLowerCase()));
        filteredMessages.push(...filteredThreads);
      }
    }

    for (const { channelId, messages } of channelMessagesResults) {
      const filtered = messages.filter((m) => m.text.toLowerCase().includes(searchText.toLowerCase()));
      filteredMessages.push(...filtered);

      const threadPromises = messages.map((msg) => this.getThreadMessages(channelId, msg.id));
      const threadResults = await Promise.all(threadPromises);

      for (const threadMsgs of threadResults) {
        const filteredThreads = threadMsgs.filter((m) => m.text.toLowerCase().includes(searchText.toLowerCase()));
        filteredMessages.push(...filteredThreads);
      }
    }

    filteredMessages = this.removeDuplicates(filteredMessages);
    this.sortMessagesByTimestamp(filteredMessages);

    return {
      users: [],
      channels: [],
      messages: filteredMessages,
      noResultsMessage: filteredMessages.length === 0 ? 'Keine Nachrichten gefunden.' : '',
    };
  }

  async getMessagesFromCollection(colRef: CollectionReference): Promise<any[]> {
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const allUsers = this.firestoreService.userList();
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const createdAt = doc.data()['createdAt']?.toDate();
      return {
        id: doc.id,
        text: doc.data()['text'] || doc.data()['content'] || '',
        userId: doc.data()['senderId'],
        timestamp: createdAt ? createdAt.getTime() : 0,
        userName: allUsers.find((u) => u.uid === doc.data()['senderId'])?.name || 'Unknown',
      };
    });
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

    try {
      const allChannels = await this.channelService.getAllChannels();
      const allDirectMessages = await this.directMessageService.getAllDirectMessages();

      const foundInChannel = await this.findMessageInChannels(allChannels, messageId);
      if (foundInChannel) {
        this.searchText = '';
        return;
      }

      const foundInDM = await this.findMessageInDirectMessages(allDirectMessages, messageId);
      if (foundInDM) {
        this.searchText = '';
        return;
      }

      console.warn('Message not found in channels or DMs:', messageId);
    } catch (error) {
      console.error('Error selecting message:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async findMessageInChannels(channels: any[], messageId: string): Promise<boolean> {
    for (const channel of channels) {
      if (await this.navigateIfChannelMessageExists(channel.channelId, messageId)) {
        return true;
      }

      if (await this.navigateIfChannelThreadExists(channel.channelId, messageId)) {
        return true;
      }
    }
    return false;
  }

  async findMessageInDirectMessages(dms: any[], messageId: string): Promise<boolean> {
    for (const dm of dms) {
      if (await this.navigateIfDirectMessageExists(dm.directMessagesId, messageId)) {
        return true;
      }

      if (await this.navigateIfDirectThreadExists(dm.directMessagesId, messageId)) {
        return true;
      }
    }
    return false;
  }

  async navigateIfChannelMessageExists(channelId: string, messageId: string): Promise<boolean> {
    const ref = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      this.router.navigate(['channel', channelId]);
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

      if (snap.exists()) {
        this.router.navigate(['channel', channelId], {
          queryParams: { threadMessageId: messageId },
        });
        return true;
      }
    }
    return false;
  }

  async navigateIfDirectMessageExists(dmId: string, messageId: string): Promise<boolean> {
    const ref = doc(this.firestore, `directMessages/${dmId}/messages/${messageId}`);
    const snap = await getDoc(ref);

    if (snap.exists()) {
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

      if (snap.exists()) {
        this.router.navigate(['directMessages', dmId, 'messages', msg.id], {
          queryParams: { threadMessageId: messageId },
        });
        return true;
      }
    }
    return false;
  }
}
