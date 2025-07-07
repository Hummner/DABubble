import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '../services/auth.service';
import { FirestoreService } from '../services/firestore.service';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [MatIconModule, MatSidenavModule, NgIf],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss',
})
export class ChannelComponent implements OnInit {
  showFiller = false;
  authService = inject(AuthService);
  router = inject(Router);
  userProfile = this.firestoreService.userProfile;

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit(): void {}

  logOut() {
    this.authService.logout();
    this.router.navigateByUrl('/');
  }
}
