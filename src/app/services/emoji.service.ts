import { Injectable, signal } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Message } from '../interfaces/message.interface';
import { ThreadDirectMessageService } from './thread-direct-message.service';
import { MessageService } from './message.service';

@Injectable({
  providedIn: 'root',
})
export class EmojiServiceService {
  private smallEmojiMenuSignal = signal<boolean>(false);
  readonly smallEmojiMenu = this.smallEmojiMenuSignal.asReadonly();

  constructor(
    private firestore: FirestoreService,
    private threadMsgService: ThreadDirectMessageService,
    private dmMsgService: MessageService
  ) {}

  emojiList = [
    { name: 'checked', code: '✅' },
    { name: 'thumb', code: '👍' },
    { name: 'nerd', code: '🤓' },
    { name: 'rocket', code: '🚀' },
    { name: 'sad', code: '😢' },
    { name: 'party', code: '🥳' },
    { name: 'surprised', code: '😲' },
    { name: 'love', code: '😍' },
    { name: 'confusion', code: '😕' },
    { name: 'heart', code: '❤️' },
    { name: 'cool', code: '😎' },
    { name: 'angry', code: '😠' },
  ];

  emojiHistory: typeof this.emojiList = [];

  selectEmoji(name: string) {
    const selected = this.emojiList.find((emoji) => emoji.name === name);
    if (!selected) return;
    const updatedHistory = [selected, ...this.emojiHistory.filter((e) => e.name !== selected.name)].slice(0, 2);
    const rest = this.emojiList.filter((e) => !updatedHistory.some((used) => used.name === e.name));
    this.emojiHistory = [...updatedHistory, ...rest];
    localStorage.setItem('usedEmoji', JSON.stringify(this.emojiHistory));
  }

  get sortedEmojis() {
    if (this.emojiHistory.length !== 0) {
      return this.emojiHistory;
    }
    const savedInLocal = localStorage.getItem('usedEmoji');
    return savedInLocal ? JSON.parse(savedInLocal) : this.emojiList;
  }

  toggleEmojiReaction(
    emojiName: string,
    message: Message,
    channelId: string,
    inThreadView: boolean,
    parentMessageId?: string
  ): void {
    if (!message?.id) return;
    const userId = this.firestore.getUserId();
    if (!userId) return;
    const docId = parentMessageId ?? message.id;
    const updatedReactions = this.getUpdatedReactions(emojiName, message.reactions ?? [], userId);
    message.reactions = updatedReactions;
    this.updateMessage(message, docId, channelId, inThreadView, parentMessageId);
  }

  private getUpdatedReactions(
    emojiName: string,
    reactions: { emojiName: string; users: string[] }[],
    userId: string
  ): { emojiName: string; users: string[] }[] {
    const updatedReactions = [...reactions];
    const reaction = updatedReactions.find((r) => r.emojiName === emojiName);
    if (reaction) {
      this.toggleUserReaction(reaction.users, userId);
    } else {
      updatedReactions.push({ emojiName, users: [userId] });
    }
    return updatedReactions;
  }

  private toggleUserReaction(users: string[], userId: string): void {
    const index = users.indexOf(userId);
    if (index >= 0) {
      users.splice(index, 1);
    } else {
      users.push(userId);
    }
  }

  private updateMessage(msg: Message, docId: string, channelId: string, inThread: boolean, threadId?: string) {
    inThread && threadId
      ? this.threadMsgService.updateThreadMessage(msg, threadId, channelId, msg.id!)
      : this.dmMsgService.updateMessage(msg, docId, channelId);
  }

  toggleSmallEmojiMenu(): boolean {
    const currentState = this.smallEmojiMenuSignal();
    this.smallEmojiMenuSignal.set(!currentState);
    return !currentState;
  }

  closeEmojiBox(): void {
    this.smallEmojiMenuSignal.set(false);
  }

  addEmojiToContent(emoji: any, currentContent: string): string {
    if (emoji) {
      return currentContent + emoji;
    }
    return currentContent;
  }
}
