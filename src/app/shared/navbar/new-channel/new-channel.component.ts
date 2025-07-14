import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogActions, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { NgClass } from '@angular/common';
import { AddChannelMemberComponent } from '../add-channel-member/add-channel-member.component';

@Component({
  selector: 'app-new-channel',
  standalone: true,
  templateUrl: './new-channel.component.html',
  styleUrl: './new-channel.component.scss',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogActions,
    MatDialogModule,
    NgClass,
  ],
})
export class NewChannelComponent {

  constructor(public radioDialog: MatDialog) {}

  channelName: string = '';
  dialogRef = inject(MatDialogRef<NewChannelComponent>);
  radioRef = inject(MatDialogRef<AddChannelMemberComponent>);

  closeDialog() {
    this.dialogRef.close();
  }

  createChannel() {
    const dialogRef = this.radioDialog.open(AddChannelMemberComponent, {
      data: {
        channelName: this.channelName
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });

    this.closeDialog();
  }

}
