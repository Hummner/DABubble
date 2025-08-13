import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FirestoreService } from '../../services/firestore.service';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../services/auth.service';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatIconModule, NgIf, MatMenuModule, UserProfileComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  userProfile = this.firestoreService.userProfile;
  router = inject(Router);
  authService = inject(AuthService);
  profileCardOpen = false;
  backdropVisible = false;
  searchText = '';
  filteredUsers: UserProfileInterface[] = [];
  members: { id: string; role: string; name: string, imgUrl: string }[] = [];
  user: UserProfileInterface | null = null;

  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;
  ngOnInit(): void {
    const user = this.userProfile();
    if (user) {
      this.user = { ...user };
    }
  }
  constructor(
    private firestoreService: FirestoreService,
    public dialog: MatDialog,
  ) {}

  openProfile() {
    this.profileCardOpen = true;
    this.backdropVisible = true;
  }

  closeProfile() {
    this.profileCardOpen = false;
    this.backdropVisible = false;
  }

  closeAll() {
    this.profileCardOpen = false;
    if (this.menuTrigger?.menuOpen) {
      this.menuTrigger.closeMenu();
    }
    requestAnimationFrame(() => {
      this.backdropVisible = false;
    });
  }

  showOverlay() {
    this.backdropVisible = true;
  }

  onMenuClosed() {
    if (!this.profileCardOpen) {
      this.backdropVisible = false;
    }
  }

  logOut() {
    this.authService.logout();
    this.router.navigateByUrl('/');
  }

  searchDevspace(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim();
    this.searchText = value;

    if (this.searchText !== '') {
      this.filteredUsers = this.firestoreService.userList()
        .filter(user =>
          user.uid !== this.userProfile()?.uid &&
          user.name.toLowerCase().includes(this.searchText.toLowerCase()) &&
          !this.members.find(m => m.id === user.uid)
        );
    } else {
      this.filteredUsers = [];
    }
  }

}
