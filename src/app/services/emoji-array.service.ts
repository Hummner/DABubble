import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmojiArrayService {

  emojiList = [
    '✅', '👍', '🤓', '🚀', '😢', '🥳', '😲', '😍', '😕', '❤️', '😎', '😠'];

  emojiUsageHistory: string[] = [];

  constructor() { }
}
