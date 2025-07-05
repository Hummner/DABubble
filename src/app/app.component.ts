import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { collection, onSnapshot, Firestore } from '@angular/fire/firestore';
import { HeaderComponent } from './shared/header/header.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { Router } from '@angular/router';

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
  constructor() {
    console.log(this.router.url);
  }
  excludeHeaderAndNavbar() {
    if (
      this.router.url !== '/' &&
      this.router.url !== '/signup' &&
      this.router.url !== '/avatarSelection' &&
      this.router.url !== '/resetPassword'
    ) {
      return true;
    } else {
      return false;
    }
  }
}
