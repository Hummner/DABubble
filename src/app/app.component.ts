import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';

import { HeaderComponent } from './shared/header/header.component';
import { NavbarComponent } from './shared/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'dabubble';
  router = inject(Router);

  isAuthLayout = false;
  isNavbarClosed = false;
  windowWidth = window.innerWidth;

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateLayoutForRoute(event.urlAfterRedirects);
      }
    });
  }

  @HostListener('window:resize', ['$event.target.innerWidth'])
  onResize(width: number) {
    this.windowWidth = width;
    this.updateNavbarVisibility();
  }

  private updateNavbarVisibility() {
    const url = this.router.url;
    const hideNavbarRoutes = ['/channel/', '/directMessages/', '/newMessage'];
    const shouldCloseNavbar = this.windowWidth < 992 && hideNavbarRoutes.some((path) => url.startsWith(path));
    this.isNavbarClosed = shouldCloseNavbar;
  }

  private updateLayoutForRoute(url: string) {
    this.isAuthLayout =
      url === '/' ||
      ['/resetPassword', '/signup', '/avatarSelection', '/resetPassword/newPassword'].some((path) => url.startsWith(path));
    this.updateNavbarVisibility();
  }

  onToggleNavbar() {
    this.isNavbarClosed = false;
    if (this.windowWidth >= 992) {
      this.router.navigateByUrl('/channel/1aJzYjqviVDIhmPzxmtc');
    } else {
      this.router.navigateByUrl('/dashboard');
    }
  }

  closeNavbar() {
    this.isNavbarClosed = true;
  }
}
