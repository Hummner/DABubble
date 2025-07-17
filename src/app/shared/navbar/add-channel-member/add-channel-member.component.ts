import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { UserProfileInterface } from '../../../interfaces/user-profile.interface';
import { FirestoreService } from '../../../services/firestore.service';
import { NavbarInterface } from '../../../interfaces/navbar.interface';
import { User } from 'firebase/auth';
import { updateDoc, arrayUnion, Firestore, doc } from '@angular/fire/firestore';

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
  navbar: Partial<NavbarInterface> = {}
  channelName = '';
  channelDescription = '';
  channelId = '';
  inviteMode  = 1;
  searchText  = '';
  allUsers: UserProfileInterface[] = [];

  constructor(
    private firestore: Firestore,
    private firestoreService: FirestoreService,
    private dialogRef: MatDialogRef<AddChannelMemberComponent>,
    @Inject(MAT_DIALOG_DATA) data: { channelName: string, channelDescription: string, channelId: string },
  ) {
    this.channelName = data?.channelName ?? '';
    this.channelDescription = data?.channelDescription ?? '';
    this.channelId = data?.channelId ?? '';
  }

  ngOnInit(): void {
    const user = this.userProfile();
    if (user) {
      this.user = { ...user };
    }
  }

  getOtherUserList() {
    this.allUsers = this.firestoreService.userList.filter(
      (user) => user.uid !== this.userProfile()?.uid
    );
    this.searchUser();
    return this.allUsers;
  }

  closeDialog() {
    this.dialogRef.close();
  }

  addMember(userId: string) {
    for (let i = 0; i < this.allUsers.length; i++) {
      if (this.allUsers[i].uid === userId) {
        this.fillInterfaceWithMember(this.allUsers[i]);
      }
    }
  }

  isDisabled(): boolean {
    return this.inviteMode === 2 && !this.searchText.trim();
  }

  searchUser() {
    this.searchText = this.searchText.trim();
    if (this.searchText !== '') {
      this.allUsers = this.firestoreService.userList.filter(
        (user) =>
          user.name.toLowerCase().includes(this.searchText.toLowerCase()) 
      );
    }
  }

  fillInterfaceWithMember(data: any) {
    this.navbar.createdBy = this.userProfile()?.name || '';
    if (data.uid === this.userProfile()?.uid) {
      this.navbar.members = [{ uid: data.uid, role: 'admin', name: data.name }];
    }
    else {
      this.navbar.members = [{ uid: data.uid, role: 'member', name: data.name }];
    }
    return this.navbar;
  }

  addMemberToChannel() {

    const channelRef = doc(this.firestore, 'channels', this.channelId); 
    console.log('Member(s) to add:', this.navbar.members);
    
    updateDoc(channelRef, {
      members: arrayUnion(...(this.navbar.members || [])),
      createdBy: this.navbar.createdBy
    }).then(() => {
      console.log('Member added successfully');
    }).catch((error) => {
      console.error('Error adding member to channel:', error);
    });
    this.closeDialog();
  }
}
