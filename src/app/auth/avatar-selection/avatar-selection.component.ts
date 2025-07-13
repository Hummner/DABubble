import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { updateProfile } from '@angular/fire/auth';
import { FirestoreService } from '../../services/firestore.service';
import { Header2Component } from '../../shared/header-2/header-2.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-avatar-selection',
  standalone: true,
  imports: [RouterLink, Header2Component, FooterComponent],
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
      this.router.navigateByUrl('/channel');
    } catch (error) {
      console.error('Error completing registration:', error);
    }
  }
}
