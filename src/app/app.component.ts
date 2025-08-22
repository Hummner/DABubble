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
        this.isNavbarClosed = hideNavbarRoutes.some((path) => url.startsWith(path)) && this.windowWidth < 992;

        console.log('URL:', url, 'Navbar closed:', this.isNavbarClosed, 'Width:', this.windowWidth);
      }
    });
  }
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.windowWidth = (event.target as Window).innerWidth;
    const url = this.router.url;
    const hideNavbarRoutes = ['/channel/', '/directMessages/', '/newMessage'];
    this.isNavbarClosed = hideNavbarRoutes.some((path) => url.startsWith(path)) && this.windowWidth < 992;
  }

  onToggleNavbar() {
    this.isNavbarClosed = false;
    this.router.navigateByUrl('/channel/1aJzYjqviVDIhmPzxmtc');
  }
}
