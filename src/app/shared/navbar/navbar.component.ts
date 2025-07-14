import { Component, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NewChannelComponent } from './new-channel/new-channel.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FirestoreService } from '../../services/firestore.service';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { NgIf } from '@angular/common';
import { User } from 'firebase/auth';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatIconModule,
    MatToolbarModule,
    MatDialogModule,
    NgIf,
    RouterModule
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  userProfile = this.firestoreService.userProfile;
  user: UserProfileInterface | null = null;

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

  showChannel = true;
  showMessage = true;
  isOpen = true;

  toggleDrawer() {
    this.isOpen = !this.isOpen;
  }

  openDialog() {
    const dialogRef = this.dialog.open(NewChannelComponent);

    dialogRef.afterClosed().subscribe((result) => {
      console.log(`Dialog result: ${result}`);
    });
  }
}
