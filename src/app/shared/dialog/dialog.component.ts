import { Component } from '@angular/core';

@Component({
  selector: 'app-new-channel-dialog',
  standalone: true,
  imports: [ ],
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent {
  constructor(
  ) {}

  showDialog = false;
  channelName = false;

  openDialog() {
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
  }

  createChannel() {
    this.closeDialog();
  }

}
