import { Injectable, signal } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { Message } from '../interfaces/message.interface';
import { ThreadDirectMessageService } from './thread-direct-message.service';
import { MessageService } from './message.service';
import { TicketInterface } from '../interfaces/ticket.interface';
import { DocumentData, DocumentReference, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class EmojiServiceService {
  private smallEmojiMenuSignal = signal<boolean>(false);
  readonly smallEmojiMenu = this.smallEmojiMenuSignal.asReadonly();
  private smallEmojiMenuEditSignal = signal<boolean>(false);
  readonly smallEmojiEditMenu = this.smallEmojiMenuEditSignal.asReadonly();
  private smallEmojiMenuInputSignal = signal<boolean>(false);
  readonly smallEmojiMenuInput = this.smallEmojiMenuInputSignal.asReadonly();
  private smallEmojiMenuThreadInputSignal = signal<boolean>(false);
  readonly smallEmojiMenuThreadInput = this.smallEmojiMenuThreadInputSignal.asReadonly();

  constructor(
    private firestore: FirestoreService,
    private threadMsgService: ThreadDirectMessageService,
    private dmMsgService: MessageService
  ) { }

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
    { name: 'fires', code: '🔥' },
    { name: 'smile', code: '☺️' },
    { name: 'laughing', code: '😆' },
    { name: 'pray', code: '🙏' },
    { name: 'sleeping', code: '😴' },
    { name: 'halo', code: '😇' },
    { name: 'confetty', code: '🎉' },
    { name: 'kiss', code: '😘' },
  ];

  //  { name: 'poop', code: '💩' },
  //     { name: 'sad-cry', code: '😢' },
  //     { name: 'vomit', code: '🤮' },
  //     { name: 'fear', code: '😨' },
  //     { name: 'shocked', code: '😱' },
  //     { name: 'cry', code: '😭' },
  //     { name: 'devil', code: '😈' },
  //      { name: 'monkey-see-no', code: '🙈' },
  //     { name: 'monkey-say-no', code: '🙊' },
  //     { name: 'monkey-hear-no', code: '🙉' },

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
    if (this.emojiHistory.length !== 0) return this.emojiHistory;
    const savedInLocal = localStorage.getItem('usedEmoji');
    return savedInLocal ? JSON.parse(savedInLocal) : this.emojiList;
  }

  toggleEmojiReaction(emojiName: string, message: Message, chID: string, inThreadView: boolean, pMID?: string): void {
    if (!message?.id) return;
    const userId = this.firestore.getUserId();
    if (!userId) return;
    const docId = pMID ?? message.id;
    const updatedReactions = this.getUpdatedReactions(emojiName, message.reactions ?? [], userId);
    message.reactions = updatedReactions;
    this.updateMessage(message, docId, chID, inThreadView, pMID);
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
      if (reaction.users.length === 0) {
        this.removeEmoji(updatedReactions, reaction);
      }
    } else {
      updatedReactions.push({ emojiName, users: [userId] });
    }
    return updatedReactions;
  }

  removeEmoji(reactions: { emojiName: string; users: string[] }[],
    reaction: { emojiName: string; users: string[] }) {
    return reactions.splice(reactions.indexOf(reaction), 1);
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

  toggleSmallEmojiEditMenu(): boolean {
    const currentState = this.smallEmojiMenuEditSignal();
    this.smallEmojiMenuEditSignal.set(!currentState);
    return !currentState;
  }

  toggleSmallEmojiInputMenu(): boolean {
    const currentState = this.smallEmojiMenuInputSignal();
    this.smallEmojiMenuInputSignal.set(!currentState);
    return !currentState;
  }

  toggleSmallEmojiThreadInputMenu(): boolean {
    const currentState = this.smallEmojiMenuThreadInputSignal();
    this.smallEmojiMenuThreadInputSignal.set(!currentState);
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

  addEmojiToTicket(
    senderId: string,
    isEmoji: boolean,
    isUserAddedReaction: boolean,
    reactionsCopy: { emoji: string; users: string[] }[],
    indexOfEmoji: number, emoji: string,
    ticket: TicketInterface,
    ticketRef: DocumentReference<DocumentData, DocumentData>
  ) {
    if (isEmoji && !isUserAddedReaction) {
      reactionsCopy[indexOfEmoji] = this.addUserIdToEmoji(senderId!, indexOfEmoji, emoji, reactionsCopy, ticket)
      this.updateReaction(reactionsCopy, ticketRef, ticket)
    } else if (!isEmoji) {
      this.addnewEmoji(reactionsCopy, emoji, senderId!)
      this.updateReaction(reactionsCopy, ticketRef, ticket)

    } else if (isEmoji && isUserAddedReaction) {
      this.deleteUserOrEmoji(reactionsCopy, indexOfEmoji, senderId!, emoji, ticketRef, ticket)
    }
  }

  deleteUserOrEmoji(reactionsCopy: { emoji: string; users: string[] }[], indexOfEmoji: number, senderId: string, emoji: string,
    ticketRef: DocumentReference<DocumentData, DocumentData>, ticket: TicketInterface
  ) {
    let users = reactionsCopy[indexOfEmoji].users
    let indexUser = reactionsCopy[indexOfEmoji].users.findIndex(user => user === senderId!)
    let newUserArray = users.splice(indexUser, 1)
    if (users.length === 0) {
      reactionsCopy.splice(indexOfEmoji, 1);
      this.updateReaction(reactionsCopy, ticketRef, ticket)
    } else {
      reactionsCopy[indexOfEmoji] = {
        emoji: emoji,
        users: newUserArray
      }
      this.updateReaction(reactionsCopy, ticketRef, ticket)
    }
  }

  addnewEmoji(reactionsCopy: { emoji: string; users: string[] }[], emoji: string, senderId: string) {
    reactionsCopy.push({
      emoji: emoji,
      users: [senderId!]
    })
  }

  addUserIdToEmoji(
    senderId: string,
    indexOfEmoji: number,
    emoji: string, reactionsCopy: { emoji: string; users: string[] }[],
    ticket: TicketInterface
  ) {
    let usersCopy = [...ticket.reactions[indexOfEmoji].users]
    usersCopy.push(senderId!)
    return reactionsCopy[indexOfEmoji] = {
      emoji: emoji,
      users: usersCopy
    }
  }

  async updateReaction(reactionsCopy: { emoji: string; users: string[] }[], ticketRef: DocumentReference<DocumentData, DocumentData>, ticket: TicketInterface,) {

    try {
      await updateDoc(ticketRef, {
        reactions: reactionsCopy
      });
      ticket.reactions = reactionsCopy;
    } catch (err) {
      console.error("Failed to update reactions:", err);
    }
  }


}
