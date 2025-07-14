import { Component, inject, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NewChannelComponent } from './new-channel/new-channel.component';
import { AddChannelMemberComponent } from './add-channel-member/add-channel-member.component';
import { NavbarService } from '../../services/navbar.service';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatIconModule,
    MatToolbarModule,
    MatDialogModule,
    NgFor,
    NgIf,
    AsyncPipe,
    RouterModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})

export class NavbarComponent implements OnInit {
  userProfile = this.firestoreService.userProfile;
  user: UserProfileInterface | null = null;
  channels$ = inject(NavbarService).channelsObs$;

  ngOnInit(): void {
    const user = this.userProfile();
    if (user) {
      this.user = { ...user };
    }
  }
  constructor(
    public dialog: MatDialog,
    private firestoreService: FirestoreService
  ) {}

  getOtherUserList(): UserProfileInterface[] {
    return this.firestoreService.userList.filter(
      (user) => user.uid !== this.userProfile()?.uid
    );
  }
  isOpen = true;
  showChannel = true;
  showMessage = true;

  toggleDrawer() {
    this.isOpen = !this.isOpen;
  }

  openDialog() {
    this.dialog.open(NewChannelComponent)
      .afterClosed()
      .subscribe(channelName => {
        if (!channelName) return;
        this.dialog.open(AddChannelMemberComponent, {
          data: { channelName }
        });
      });
  }
}
