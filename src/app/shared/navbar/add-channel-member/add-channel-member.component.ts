import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { UserProfileInterface } from '../../../interfaces/user-profile.interface';
import { FirestoreService } from '../../../services/firestore.service';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-add-channel-member',
  standalone: true,
  templateUrl: './add-channel-member.component.html',
  styleUrl: './add-channel-member.component.scss',
  imports: [
    FormsModule, 
    NgIf, 
    NgClass, 
    CommonModule,
    RouterModule
  ]
})
export class AddChannelMemberComponent {

  userProfile = this.firestoreService.userProfile;
  user: UserProfileInterface | null = null;
  channelName = '';
  inviteMode  = 1;
  searchText  = '';

  constructor(
    private firestoreService: FirestoreService,
    private dialogRef: MatDialogRef<AddChannelMemberComponent>,
    @Inject(MAT_DIALOG_DATA) data: { channelName: string }
  ) {
    this.channelName = data?.channelName ?? '';
  }

  ngOnInit(): void {
    const user = this.userProfile();
    if (user) {
      this.user = { ...user };
    }
  }

  getOtherUserList(): UserProfileInterface[] {
    return this.firestoreService.userList.filter(
      (user) => user.uid !== this.userProfile()?.uid
    );
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
