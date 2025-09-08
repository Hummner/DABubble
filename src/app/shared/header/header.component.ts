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
import { ResponsiveMenuOverlayService } from '../../services/responsive-menu-overlay.service';
import { SearchService } from '../../services/search.service';
import { NavbarService } from '../../services/navbar.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatIconModule, NgIf, MatMenuModule, UserProfileComponent, DatePipe, AsyncPipe, NgClass, MatProgressSpinnerModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  userProfile = this.firestoreService.userProfile;
  router = inject(Router);
  authService = inject(AuthService);
  searchService = inject(SearchService);
  navbarService = inject(NavbarService);
  profileCardOpen = false;
  backdropVisible = false;
  channelService = inject(ChannelsService);
  user: UserProfileInterface | null = null;

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
    private menuOverlay: ResponsiveMenuOverlayService
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
    this.menuOverlay.reposition(this.menuTrigger, this.isMobileView);
  }

  showOverlay() {
    this.menuOverlay.open(this.menuTrigger, this.isMobileView);
    this.backdropVisible = true;
  }

  onMenuClosed() {
    if (!this.profileCardOpen) this.backdropVisible = false;
    this.menuOverlay.handleMenuClosed(this.menuTrigger, this.isMobileView);
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
}
