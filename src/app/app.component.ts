import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { collection, onSnapshot, Firestore } from '@angular/fire/firestore';
import { HeaderComponent } from './shared/header/header.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

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
  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;

        // Root is login, and possibly other auth paths
        this.isAuthLayout =
          url === '/' ||
          [
            '/resetPassword',
            '/signup',
            '/avatarSelection',
            '/resetPassword/newPassword',
          ].some((path) => url.startsWith(path));
      }
    });
  }
}
// get excludeHeaderMainandNavbar() {

//   return ![
//     '',
//     '/',
//     '/signup',
//     '/avatarSelection',
//     '/resetPassword',
//     '/resetPassword/newPassword',
//   ].includes(this.currentPath);
// }
