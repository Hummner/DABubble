import { Component, inject, OnInit, Input, Output, EventEmitter, HostListener, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FirestoreService } from '../../services/firestore.service';
import { NgIf, DatePipe, AsyncPipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../services/auth.service';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { MatMenuTrigger } from '@angular/material/menu';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { MatDialog } from '@angular/material/dialog';
import { ChannelsService } from '../../services/channels.service';
import { OverlayPositionBuilder } from '@angular/cdk/overlay';
import { Firestore, collection, getDocs, query, orderBy, limit } from '@angular/fire/firestore';
import { SearchService } from '../../services/search.service';
import { NavbarService } from '../../services/navbar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatIconModule, NgIf, MatMenuModule, UserProfileComponent, DatePipe, AsyncPipe, NgClass],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  userProfile = this.firestoreService.userProfile;
  router = inject(Router);
  authService = inject(AuthService);
  firestore = inject(Firestore);
  searchService = inject(SearchService);
  navbarService = inject(NavbarService);
  profileCardOpen = false;
  backdropVisible = false;
  filteredUsers: UserProfileInterface[] = [];
  channelService = inject(ChannelsService);
  filteredChannels: any[] = [];
  filteredMessages: any[] = [];
  highlightedMessages: any[] = [];
  members: { id: string; role: string; name: string; imgUrl: string }[] = [];
  user: UserProfileInterface | null = null;
  noResultsMessage: string = '';

  @Input() isNavbarClosed!: boolean;
  @Output() toggleNavbar = new EventEmitter<void>();
  isMobileView = false;
  private previousIsMobileView = false;
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;

  ngOnInit(): void {
    const user = this.userProfile();
    if (user) {
      this.user = { ...user };
    }
    this.checkScreenWidth();
  }
  constructor(
    private firestoreService: FirestoreService,
    public dialog: MatDialog,
    private overlayPositionBuilder: OverlayPositionBuilder
  ) {}

  @HostListener('window:resize')
  onResize() {
    this.checkScreenWidth();
    if (this.previousIsMobileView !== this.isMobileView) {
      this.adjustMenuPosition();
      this.previousIsMobileView = this.isMobileView;
    } else if (this.menuTrigger?.menuOpen) {
      this.adjustMenuPosition();
    }
  }

  checkScreenWidth() {
    this.isMobileView = window.innerWidth < 992;
  }


  private adjustMenuPosition() {
    if (!this.menuTrigger?.menuOpen) return;
    const overlayRef: any = (this.menuTrigger as any)['_overlayRef'];
    if (!overlayRef || !overlayRef.overlayElement) return;

    if (this.isMobileView) {
      const mobileStrategy = this.overlayPositionBuilder.global().bottom('0px').left('0px').width('100%');
      overlayRef.updatePositionStrategy(mobileStrategy);
      overlayRef.updatePosition();
    } else {
      const triggerElement: any = (this.menuTrigger as any)['_element'];
      if (triggerElement) {
        const desktopStrategy = this.overlayPositionBuilder
          .flexibleConnectedTo(triggerElement)
          .withPositions([
            { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
            { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
          ])
          .withPush(false);
        overlayRef.updatePositionStrategy(desktopStrategy);
        overlayRef.updatePosition();
      }
      const el: HTMLElement | null = overlayRef.overlayElement as HTMLElement;
      if (el) {
        el.classList.remove('slide-in', 'slide-out');
        el.style.width = '';
      }
    }
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
      this.adjustMenuPosition();
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


  logOut() {
    this.authService.logout();
    this.router.navigateByUrl('/');
  }

    onMenuClick() {
    this.toggleNavbar.emit();
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
