import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [MatIconModule, MatSidenavModule],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss',
})
export class ChannelComponent implements OnInit {
  showFiller = false;
  authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.authService.currentUserSign.set({
          email: user.email!,
          name: user.displayName!,
        });
      } else {
        this.authService.currentUserSign.set(null);
      }
      console.log(this.authService.currentUserSign());
      console.log(user?.uid)
    });
  }

  logOut() {
    this.authService.logout();
    console.log('button clicked');
  }
}
