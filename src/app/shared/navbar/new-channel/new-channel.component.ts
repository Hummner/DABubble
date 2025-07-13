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

  channelName = '';
  dialogRef = inject(MatDialogRef<NewChannelComponent>);
  radioRef = inject(MatDialogRef<AddChannelMemberComponent>);

  closeDialog() {
    this.dialogRef.close();
  }

  createChannel() {
    this.closeDialog();
    const radioRef = this.radioDialog.open(AddChannelMemberComponent);

    radioRef.afterClosed().subscribe(result => {
      console.log(`Radiodialog result: ${result}`);
    });
  }
}
