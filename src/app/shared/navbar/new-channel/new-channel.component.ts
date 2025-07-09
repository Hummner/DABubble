import { Component } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-new-channel',
  standalone: true,
  imports: [ NgClass],
  templateUrl: './new-channel.component.html',
  styleUrl: './new-channel.component.scss'
})
export class NewChannelComponent {
    constructor(
  ) {}

  showDialog = true;
  channelName = false;

  openDialog() {
    this.showDialog = true;
  }

  closeDialog(event: MouseEvent) {
      event.stopPropagation();
      this.showDialog = false; 
  }

  createChannel() {
    
  }
}
