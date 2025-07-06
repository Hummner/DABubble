import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '../services/auth.service';
import { FirestoreService } from '../services/firestore.service';


@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [MatIconModule, MatSidenavModule],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss',
})
export class ChannelComponent {
  showFiller = false;
  authService = inject(AuthService);
  user = this.authService.firebaseAuth.currentUser;
  firestoreService = inject(FirestoreService)



  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.authService.currentUserSign.set({
          email: user.email!,
          name: user.displayName!,
          imgUrl: user.photoURL!,
        });
        this.firestoreService.queryUser();
      } else {
        this.authService.currentUserSign.set(null);
      }
      console.log(this.authService.currentUserSign());
      console.log(user?.uid);
      console.log(user);
    });
  }
  constructor() {
    console.log(this.user);
  }

  logOut() {
    this.authService.logout();
    console.log('button clicked');
  }
}
