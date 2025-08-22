import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from './shared/header/header.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
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
        const url = event.urlAfterRedirects;
        this.isAuthLayout =
          url === '/' ||
          ['/resetPassword', '/signup', '/avatarSelection', '/resetPassword/newPassword'].some((path) => url.startsWith(path));
        const hideNavbarRoutes = ['/channel/', '/directMessages/', '/newMessage'];
        const shouldCloseNavbar = hideNavbarRoutes.some((path) => url.startsWith(path)) && this.windowWidth < 992;
        if (this.windowWidth < 992) {
          if (shouldCloseNavbar) {
            this.isNavbarClosed = true;
          } else {
            this.isNavbarClosed = false;
          }
        } else {
          this.isNavbarClosed = false;
        }
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.windowWidth = (event.target as Window).innerWidth;
    const url = this.router.url;
    const hideNavbarRoutes = ['/channel/', '/directMessages/', '/newMessage'];
    if (this.windowWidth < 992) {
      const shouldCloseNavbar = hideNavbarRoutes.some((path) => url.startsWith(path));
      if (shouldCloseNavbar) {
        this.isNavbarClosed = true;
      }
    } else {
      this.isNavbarClosed = false;
    }
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
