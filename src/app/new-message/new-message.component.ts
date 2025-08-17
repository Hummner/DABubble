import { Component, ViewChild, ElementRef } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { EmojiServiceService } from '../services/emoji.service';
import { FormsModule } from '@angular/forms';
import { UserMentionService } from '../services/user-channel-mention.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormField } from '@angular/material/form-field';

import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-new-message',
  standalone: true,
  imports: [
    MatCardModule,
    MatSidenavModule,
    MatMenuModule,
    MatMenuTrigger,
    FormsModule,
    MatAutocompleteModule,

    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './new-message.component.html',
  styleUrl: './new-message.component.scss',
})
export class NewMessageComponent {
  content = '';
  address = '';
  @ViewChild('inputNew') inputNew!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('mentionTriggerNew') mentionMenuTriggerNew!: MatMenuTrigger;
  @ViewChild('channelTriggerNew') channelMenuTriggerNew!: MatMenuTrigger;
  @ViewChild('mentionTriggerAddress') mentionMenuTriggerAddress!: MatMenuTrigger;
  @ViewChild('channelTriggerAddress') channelMenuTriggerAddress!: MatMenuTrigger;
  @ViewChild('inputAddress') inputAddress!: ElementRef<HTMLInputElement>;

  constructor(public emojiService: EmojiServiceService, public userMentionService: UserMentionService) {}

  onEmojiClick(emoji: any) {
    this.addEmoji(emoji.code);
    this.emojiService.selectEmoji(emoji.name);
  }
  addEmoji(emoji: any) {
    this.content = this.emojiService.addEmojiToContent(emoji, this.content);
  }
  takeUser(name: string) {
    this.content = this.userMentionService.takeUser(name, this.content);
  }

  takeChannel(name: string) {
    this.content = this.userMentionService.takeChannel(name, this.content);
  }

  takeUserAddress(name: string) {
    this.address = this.userMentionService.takeUser(name, this.address);
  }

  takeChannelAddress(name: string) {
    this.address = this.userMentionService.takeChannel(name, this.address);
  }
  
  tagInputStart() {
    this.content = this.userMentionService.tagInputStart(this.content, this.inputNew);
  }

  tagInputChannelStart() {
    this.content = this.userMentionService.tagChannelInputStart(this.content, this.inputNew);
  }

  onInputChange(event: Event) {
    this.userMentionService.onInputChange(this.content, this.mentionMenuTriggerNew, this.channelMenuTriggerNew, this.inputNew);
  }

  onInputChangeAddress(event: Event) {
    this.userMentionService.onInputChange(
      this.address,
      this.mentionMenuTriggerAddress,
      this.channelMenuTriggerAddress,
      this.inputAddress
    );
  }
}
