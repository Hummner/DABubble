import { Component, inject, OnInit, Input, Output, EventEmitter, HostListener } from '@angular/core';
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
import { ChannelsService } from '../../services/channels.service';
import { OverlayPositionBuilder } from '@angular/cdk/overlay';

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
  channelService = inject(ChannelsService);
  filteredChannels: any[] = [];
  filteredMessages: any[] = [];
  members: { id: string; role: string; name: string; imgUrl: string }[] = [];
  user: UserProfileInterface | null = null;

  @Input() isNavbarClosed!: boolean;
  @Output() toggleNavbar = new EventEmitter<void>();
  isMobileView = false;
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
    private overlayPositionBuilder: OverlayPositionBuilder
  ) {}

  @HostListener('window:resize')
  onResize() {
    this.checkScreenWidth();
  }

  checkScreenWidth() {
    this.isMobileView = window.innerWidth < 992;
  }

  showOverlay() {
    this.menuTrigger.openMenu();

    if (this.isMobileView) {
      const overlayRef = this.menuTrigger['_overlayRef'];
      const positionStrategy = this.overlayPositionBuilder.global().bottom('0px').left('0px').width('100%');
      overlayRef.updatePositionStrategy(positionStrategy);
      overlayRef.updatePosition();

      overlayRef.overlayElement.classList.add('slide-in');
      this.backdropVisible = true;
    } else {
      this.backdropVisible = true;
    }
  }

  onMenuClosed() {
    if (!this.profileCardOpen) {
      this.backdropVisible = false;
    }
    if (this.isMobileView) {
      const overlayRef = this.menuTrigger['_overlayRef'];
      overlayRef.overlayElement.classList.remove('slide-in');
      overlayRef.overlayElement.classList.add('slide-out');

      setTimeout(() => {
        overlayRef.overlayElement.classList.remove('slide-out');
      }, 300);
    }
  }

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

  // showOverlay() {
  //   this.backdropVisible = true;
  // }

  // onMenuClosed() {
  //   if (!this.profileCardOpen) {
  //     this.backdropVisible = false;
  //   }
  // }

  logOut() {
    this.authService.logout();
    this.router.navigateByUrl('/');
  }

  async searchDevspace(event: Event) {
    const value = (event.target as HTMLInputElement).value.trim();
    this.searchText = value;
    const channels = await this.channelService.getAllChannels();

    if (this.searchText !== '') {
      if (this.searchText.startsWith('@')) {
        this.searchForUsers();
      } else if (this.searchText.startsWith('#')) {
        this.searchForChannels(channels);
      } else {
        this.searchForMessages(channels);
      }
    } else {
      this.filteredUsers = [];
      this.filteredChannels = [];
    }
  }

  searchForUsers() {
    this.searchText = this.searchText.slice(1);
    this.filteredUsers = this.firestoreService
      .userList()
      .filter(
        (user) => user.name.toLowerCase().includes(this.searchText.toLowerCase()) && !this.members.find((m) => m.id === user.uid)
      );
  }

  searchForChannels(channels: any[]) {
    this.searchText = this.searchText.slice(1);
    this.filteredChannels = channels.filter((channel) => channel.name.toLowerCase().includes(this.searchText.toLowerCase()));
  }

  async searchForMessages(channels: any[]) {
    this.searchText = this.searchText.toLowerCase();
  }

  onMenuClick() {
    this.toggleNavbar.emit();
  }
}
