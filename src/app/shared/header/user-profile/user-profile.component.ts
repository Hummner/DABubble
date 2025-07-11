import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
  user!: UserProfileInterface;
  editableUser!: UserProfileInterface;
  
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

  closeEdit() {
    this.user = { ...this.editableUser };
    this.saveName();
    this.edit = false;
  }

  cancelEdit() {
    this.edit = false;
  }

  saveName() {
    this.firestoreService.updateUser(this.user);
  }
}
