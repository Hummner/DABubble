import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { updateProfile } from '@angular/fire/auth';
import { FirestoreService } from '../../services/firestore.service';

import { Firestore, setDoc, doc } from '@angular/fire/firestore';

@Component({
  selector: 'app-avatar-selection',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss',
})
export class AvatarSelectionComponent {
  currentProfilImageUrl = '';
  profileImageChosen = false;
  authService = inject(AuthService);
  router = inject(Router);
  firestore = inject(Firestore);
  userName = '';

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
      if (user) {
        this.userName = user.displayName!;
      }
    });
  }

  chooseProfilImg(src: string) {
    console.log('chosen img', src);
    this.currentProfilImageUrl = src;
    this.profileImageChosen = true;
  }

  async completeRegistration() {
    const user = this.authService.firebaseAuth.currentUser;
    if (user) {
      await updateProfile(user, { photoURL: this.currentProfilImageUrl }).then(
        () => {
          console.log(user);
          user.reload();
          this.firestoreService.addUserToDatabase(
            JSON.parse(
              JSON.stringify(
                this.firestoreService.setUserProfileObject(user, user.uid)
              )
            ),
            user.uid
          );
          this.router.navigateByUrl('/channel');
        }
      );
    }
  }
}
