import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { updateProfile } from '@angular/fire/auth';
import { FirestoreService } from '../../services/firestore.service';
import { Header2Component } from '../../shared/header-2/header-2.component';
import { LogMessageComponent } from '../log-message/log-message.component';

@Component({
  selector: 'app-avatar-selection',
  standalone: true,
  imports: [LogMessageComponent, RouterLink, Header2Component],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss',
})
export class AvatarSelectionComponent implements OnInit {
  currentProfilImageUrl = '';
  profileImageChosen = false;
  userName = '';

  authService = inject(AuthService);
  router = inject(Router);

  profileImageUrls = [
    'assets/img/elias_neumann.svg',
    'assets/img/elise_roth.svg',
    'assets/img/frederik_beck.svg',
    'assets/img/noah_braun.svg',
    'assets/img/sofia_müller.svg',
    'assets/img/steffen_hoffmann.svg',
  ];

  @ViewChild('log') log!: LogMessageComponent;

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      if (user?.displayName) {
        this.userName = user.displayName;
      }
    });
  }

  chooseProfilImg(src: string) {
    this.currentProfilImageUrl = src;
    this.profileImageChosen = true;
  }

  async completeRegistration() {
    const user = this.authService.firebaseAuth.currentUser;
    if (!user) return;
    try {
      await updateProfile(user, { photoURL: this.currentProfilImageUrl });
      const userProfile = this.firestoreService.toUserProfile(user, user.uid);
      await this.firestoreService.addUserToDatabase(userProfile, user.uid);
      this.onSuccessfulSignup();
    } catch (error) {
      console.error('Error completing registration:', error);
    }
  }

  showLog() {
    this.log.show(2000);
  }

  onSuccessfulSignup() {
    this.showLog();
    setTimeout(() => {
      this.router.navigateByUrl('/');
    }, 2300);
  }
}
