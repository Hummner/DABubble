import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmojiServiceService } from '../../services/emoji.service';

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  imports: [],
  templateUrl: './emoji-picker.component.html',
  styleUrl: './emoji-picker.component.scss',
})
export class EmojiPickerComponent {
  @Output() emojiSelected = new EventEmitter<string>();

  constructor(private emojiService: EmojiServiceService) {}

  emojiList = this.emojiService.emojiList;

  selectEmoji(emoji: any) {
    this.emojiSelected.emit(emoji);
  }
}
