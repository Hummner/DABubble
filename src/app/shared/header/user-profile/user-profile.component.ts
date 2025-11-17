import { Component, EventEmitter, inject, OnInit, Output, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { FirestoreService } from '../../../services/firestore.service';
import { NgIf, NgClass } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { UserProfileInterface } from '../../../interfaces/user-profile.interface';
import { ChannelsService } from '../../../services/channels.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [MatCardModule, MatDialogModule, NgIf, FormsModule, NgClass],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
  @Output() close = new EventEmitter();
  @ViewChild('editForm') editForm!: NgForm;
  userProfile = this.firestoreService.userProfile;
  channelService = inject(ChannelsService);
  edit = false;
  editImg = false;
  user!: UserProfileInterface;
  editableUser!: UserProfileInterface;
  temporaryName!: string | null;
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
  isInvalidName = false;

  ngOnInit() {
    const user = this.userProfile();
    if (user) {
      this.editableUser = { ...user };
    }
  }

  get isFormValid(): boolean {
    const name = this.editableUser?.name?.trim() || '';
    const namePattern = /^[A-Za-zÄÖÜäöüß -]+$/;
    return namePattern.test(name);
  }

  constructor(private firestoreService: FirestoreService) { }

  closeProfileCard(event: any) {
    event?.stopPropagation();
    this.close.emit();
  }

  openEditProfile() {
    this.temporaryName = this.editableUser.name;
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
    this.editableUser.name = this.editableUser.name.trim();
    this.user = { ...this.editableUser };
    this.saveName();
    this.channelService.updatedChannels(this.user);
    this.edit = false;
  }

  closeEditImg() {
    this.user = { ...this.editableUser };
    this.saveImg();
    this.channelService.updatedChannels(this.user);
    this.editImg = false;
  }

  cancelEdit() {
    if (this.temporaryName) {
      this.editableUser.name = this.temporaryName
      this.temporaryName = null
      setTimeout(() => {
        this.edit = false;
      });
    }
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
