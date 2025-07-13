import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { FirestoreService } from '../../../services/firestore.service';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfileInterface } from '../../../interfaces/user-profile.interface';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [MatCardModule, MatDialogModule, NgIf, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
  @Output() close = new EventEmitter();
  userProfile = this.firestoreService.userProfile;
  edit = false;
  editImg = false;
  user!: UserProfileInterface;
  editableUser!: UserProfileInterface;
  profileImageUrls = [
    'assets/img/elias_neumann.svg',
    'assets/img/elise_roth.svg',
    'assets/img/frederik_beck.svg',
    'assets/img/noah_braun.svg',
    'assets/img/sofia_müller.svg',
    'assets/img/steffen_hoffmann.svg',
  ];
  currentProfilImageUrl = '';
  profileImageChosen = false;
  showTooltip = false;

  ngOnInit() {
    const user = this.userProfile();
    if (user) {
      this.editableUser = { ...user };
    }
  }

  constructor(private firestoreService: FirestoreService) {}

  closeProfileCard(event: any) {
    event?.stopPropagation();
    this.close.emit();
  }

  openEditProfile() {
    this.edit = true;
  }

  openEditProfileImg() {
    this.editImg = true;
    this.edit = false;
  }

  changeProfilImg(src: string) {
    this.currentProfilImageUrl = src;
    this.profileImageChosen = true;
  }

  closeEdit() {
    this.user = { ...this.editableUser };
    this.saveName();
    this.edit = false;
  }

  closeEditImg() {
    this.editImg = false;
    this.saveImg();
  }

  cancelEdit() {
    this.edit = false;
  }

  saveName() {
    this.firestoreService.updateUser(this.user);
  }

  saveImg() {
    this.editableUser.imgUrl = this.currentProfilImageUrl;
    this.user = { ...this.editableUser };
    this.firestoreService.updateUser(this.user);
  }
}
