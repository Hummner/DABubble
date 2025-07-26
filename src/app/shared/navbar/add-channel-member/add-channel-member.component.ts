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
import { ActivatedRoute, Router } from '@angular/router';

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
  members: { uid: string; role: string; name: string, imgUrl: string }[] = [];
  allUsers: UserProfileInterface[] = [];

  constructor(
    private firestore: Firestore,
    private firestoreService: FirestoreService,
    private dialogRef: MatDialogRef<AddChannelMemberComponent>,
    private route: ActivatedRoute,
    private router: Router,

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
        this.searchText = '';
      }
    }
  }

  deleteMember(userId: string) {
    for (let i = 0; i < this.members.length; i++) {
      if (this.members[i].uid === userId) {
        this.members.splice(i, 1);
      }
    }
  }

  isDisabled(): boolean {
    return this.inviteMode === 2 && this.members.length === 0;
  }

  searchUser() {
    this.searchText = this.searchText.trim();
    if (this.searchText !== '') {
      this.allUsers = this.firestoreService.userList.filter(
        (user) =>
          user.name.toLowerCase().includes(this.searchText.toLowerCase()) 
          && !this.members.find(m => m.uid === user.uid)
      );
    }
  }

  fillInterfaceWithMember(data: any) {
    this.navbar.createdBy = this.userProfile()?.name || '';

    const newMember = {
      uid: data.uid,
      role: data.uid === this.userProfile()?.uid ? 'admin' : 'member',
      name: data.name,
      imgUrl: data.imgUrl
    };

    if (!this.members.find(m => m.uid === newMember.uid)) {
      this.members.push(newMember);
    }

    this.navbar.members = this.members;

    console.log('Aktuelle Members:', this.members);
    return this.navbar;
  }

  addMemberToChannel() {
    this.updateChannel();
  }

  addAllMemmberToChannel() {
    this.getOtherUserList();
    this.navbar.createdBy = this.userProfile()?.name || '';
    this.navbar.members = this.allUsers.map((user) => ({
      uid: user.uid,
      role: user.uid === this.userProfile()?.uid ? 'admin' : 'member',
      name: user.name,
      imgUrl: user.imgUrl
    }));

    this.updateChannel();
  }

  updateChannel() {
    const channelRef = doc(this.firestore, 'channels', this.channelId); 
    console.log('Add all Members:', this.navbar.members);
    
    updateDoc(channelRef, {
      members: arrayUnion(...(this.navbar.members || [])),
      createdBy: this.navbar.createdBy,
      channelId: this.channelId
    }).then(() => {
      console.log('Member added successfully');
    }).catch((error) => {
      console.error('Error adding member to channel:', error);
    });
    this.closeDialog();
    this.router.navigateByUrl('/channel/' + this.channelId);
  }

  submitForm() {
    if (this.inviteMode === 2) {
      this.addMemberToChannel();
    } else if (this.inviteMode === 1) {
      this.addAllMemmberToChannel();
    }
  }
}
