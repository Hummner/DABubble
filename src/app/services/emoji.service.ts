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

  addOrRemoveEmoji(
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
    const reactions = [...(message.reactions ?? [])];
    const reaction = reactions.find((r) => r.emojiName === emojiName);
    reaction
      ? this.toggleUserReaction(reaction.users, userId)
      : reactions.push({ emojiName, users: [userId] });
    message.reactions = reactions;
    this.updateMessage(
      message,
      docId,
      channelId,
      inThreadView,
      parentMessageId
    );
  }

  addEmoji(
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
    const reaction = (message.reactions ??= []).find(
      (r) => r.emojiName === emojiName
    );
    if (reaction) {
      const i = reaction.users.indexOf(userId);
      i >= 0 ? reaction.users.splice(i, 1) : reaction.users.push(userId);
    } else {
      message.reactions.push({ emojiName, users: [userId] });
    }
    this.updateMessage(
      message,
      docId,
      channelId,
      inThreadView,
      parentMessageId
    );
  }

  toggleUserReaction(users: string[], userId: string) {
    const i = users.indexOf(userId);
    i >= 0 ? users.splice(i, 1) : users.push(userId);
  }

  private updateMessage(
    msg: Message,
    docId: string,
    channelId: string,
    inThread: boolean,
    threadId?: string
  ) {
    inThread && threadId
      ? this.threadMsgService.updateThreadMessage(
          msg,
          threadId,
          channelId,
          msg.id!
        )
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
