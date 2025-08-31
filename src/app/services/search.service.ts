import { Injectable, inject } from '@angular/core';
import { Firestore, collection, getDocs, query, orderBy } from '@angular/fire/firestore';
import { FirestoreService } from './firestore.service';
import { ChannelsService } from './channels.service';
import { UserProfileInterface } from '../interfaces/user-profile.interface';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  filteredChannels: any[] = [];
  highlightedMessages: any[] = [];
  noResultsMessage: string = '';
  filteredUsers: UserProfileInterface[] = [];
  members: { id: string; role: string; name: string; imgUrl: string }[] = [];
  searchText = '';
  private firestore = inject(Firestore);
  private firestoreService = inject(FirestoreService);
  private channelService = inject(ChannelsService);

  constructor () { }

  async onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchText = value;

    const result = await this.search(this.searchText, this.members);

    this.filteredUsers = result.users;
    this.filteredChannels = result.channels;
    this.highlightedMessages = result.messages;
    this.noResultsMessage = result.noResultsMessage;
  }
  async search(searchText: string, members: { id: string }[]) {
    const searchTextTrimmed = searchText.trim();
    if (!searchTextTrimmed && searchTextTrimmed === '') {
      return { users: [], channels: [], messages: [], noResultsMessage: '' };
    }

    const channels = await this.channelService.getAllChannels();

    if (searchTextTrimmed.startsWith('@')) {
      return this.searchForUsers(searchTextTrimmed.slice(1), members);
    } else if (searchTextTrimmed.startsWith('#')) {
      return this.searchForChannels(searchTextTrimmed.slice(1), channels);
    } else if (searchTextTrimmed.length > 2) {
      return this.searchForMessages(searchTextTrimmed.toLowerCase(), channels);
    }

    return { users: [], channels: [], messages: [], noResultsMessage: '' };
  }

  private searchForUsers(searchText: string, members: { id: string }[]) {
    const users = this.firestoreService.userList()
      .filter(user =>
        user.name.toLowerCase().includes(searchText.toLowerCase()) &&
        !members.find(m => m.id === user.uid)
      );
    return {
      users,
      channels: [],
      messages: [],
      noResultsMessage: users.length === 0 ? 'Kein Benutzer gefunden.' : ''
    };
  }

  private searchForChannels(searchText: string, channels: any[]) {
    const filtered = channels.filter(channel =>
      channel.name.toLowerCase().includes(searchText.toLowerCase())
    );
    return {
      users: [],
      channels: filtered,
      messages: [],
      noResultsMessage: filtered.length === 0 ? 'Kein Channel gefunden.' : ''
    };
  }

  private async searchForMessages(searchText: string, channels: any[]) {
    let highlightedMessages: any[] = [];
    const allUsers = this.firestoreService.userList();

    for (const channel of channels) {
      const q = query(
        collection(this.firestore, 'channels', channel.channelId, 'messages'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const messages: any[] = snapshot.docs.map(doc => {
        const createdAt = doc.data()['createdAt']?.toDate();
        return {
          id: doc.id,
          text: doc.data()['text'],
          userId: doc.data()['senderId'],
          timestamp: createdAt ? createdAt.getTime() : 0
        };
      });

      const filtered = messages
        .filter(m => m.text.toLowerCase().includes(searchText))
        .map(m => ({
          ...m,
          userName: allUsers.find(u => u.uid === m.userId)?.name || 'Unknown'
        }));

      highlightedMessages.push(...filtered);
    }

    highlightedMessages = this.removeDuplicates(highlightedMessages);
    this.sortMessagesByTimestamp(highlightedMessages);

    return {
      users: [],
      channels: [],
      messages: highlightedMessages,
      noResultsMessage: highlightedMessages.length === 0 ? 'Keine Nachrichten gefunden.' : ''
    };
  }

  removeDuplicates(messages: any[]) {
    return messages.filter((message, index, self) =>
      index === self.findIndex(m => m.id === message.id && m.text === message.text)
    );
  }

  sortMessagesByTimestamp(messages: any[]) {
    return messages.sort((a, b) => b.timestamp - a.timestamp);
  }
}
