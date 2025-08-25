import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FirestoreService } from '../../services/firestore.service';
import { NgIf, DatePipe, AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../services/auth.service';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { MatMenuTrigger } from '@angular/material/menu';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { MatDialog } from '@angular/material/dialog';
import { ChannelsService } from '../../services/channels.service';
import { Firestore, collection, getDocs, query, orderBy, limit } from '@angular/fire/firestore';
import { SearchService } from '../../services/search.service';
import { NavbarService } from '../../services/navbar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatIconModule, NgIf, MatMenuModule, UserProfileComponent, DatePipe, AsyncPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  userProfile = this.firestoreService.userProfile;
  router = inject(Router);
  authService = inject(AuthService);
  firestore = inject(Firestore);
  searchService = inject(SearchService);
  navbar = inject(NavbarService);
  profileCardOpen = false;
  backdropVisible = false;
  filteredUsers: UserProfileInterface[] = [];
  channelService = inject(ChannelsService);
  filteredChannels: any[] = [];
  filteredMessages: any[] = [];
  highlightedMessages: any[] = [];
  members: { id: string; role: string; name: string, imgUrl: string }[] = [];
  user: UserProfileInterface | null = null;
  noResultsMessage: string = '';

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

  async onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchService.searchText = value;

    const result = await this.searchService.search(this.searchService.searchText, this.members);

    this.filteredUsers = result.users;
    this.filteredChannels = result.channels;
    this.highlightedMessages = result.messages;
    this.noResultsMessage = result.noResultsMessage;
  }
}
