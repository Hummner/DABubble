import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-add-channel-member',
  standalone: true,
  templateUrl: './add-channel-member.component.html',
  styleUrl: './add-channel-member.component.scss',
  imports: [
    FormsModule, 
    NgIf, 
    NgClass, 
    CommonModule
  ]
})
export class AddChannelMemberComponent {
  channelName = '';
  inviteMode  = 1;
  searchText  = '';

  constructor(
    private dialogRef: MatDialogRef<AddChannelMemberComponent>,
    @Inject(MAT_DIALOG_DATA) data: { channelName: string }
  ) {
    this.channelName = data?.channelName ?? '';
  }

  closeDialog() {
    this.dialogRef.close();
  }

  addMember() {
    this.dialogRef.close({
      added: true,
      mode : this.inviteMode,
      name : this.searchText.trim()
    });
  }

  isDisabled(): boolean {
    return this.inviteMode === 2 && !this.searchText.trim();
  }
}
