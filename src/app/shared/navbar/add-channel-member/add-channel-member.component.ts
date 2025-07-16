import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';
import { UserProfileInterface } from '../../../interfaces/user-profile.interface';
import { FirestoreService } from '../../../services/firestore.service';
import { NavbarInterface } from '../../../interfaces/navbar.interface';
import { User } from 'firebase/auth';
import { addDoc, Firestore, collection, } from '@angular/fire/firestore';

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
  inviteMode  = 1;
  searchText  = '';
  allUsers: UserProfileInterface[] = [];

  constructor(
    private firestore: Firestore,
    private firestoreService: FirestoreService,
    private dialogRef: MatDialogRef<AddChannelMemberComponent>,
    @Inject(MAT_DIALOG_DATA) data: { channelName: string, channelDescription: string },
  ) {
    this.channelName = data?.channelName ?? '';
    this.channelDescription = data?.channelDescription ?? '';
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
        this.fillInterfaceWithData(this.allUsers[i]);
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

  fillInterfaceWithData(data: any) {
    this.navbar.createdBy = data.name;
    this.navbar.name = this.channelName;
    this.navbar.description = this.channelDescription;
    if (data.uid === this.userProfile()?.uid) {
      this.navbar.members = [{ uid: data.uid, role: 'admin' }];
    }
    else {
      this.navbar.members = [{ uid: data.uid, role: 'member' }];
    }
    return this.navbar;
  }

  createChannel() {
    addDoc(collection(this.firestore, 'channels'), this.navbar)
    .then((docRef) => {
      console.log('Channel was successfully created!', docRef.id);
    })
    .catch((error) => {
      console.error('Issue during channel creation', error);
    });
    this.closeDialog();
  }
}
