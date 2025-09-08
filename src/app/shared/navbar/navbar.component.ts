import { Component, inject} from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NewChannelComponent } from './new-channel/new-channel.component';
import { AddChannelMemberComponent } from './add-channel-member/add-channel-member.component';
import { NavbarService } from '../../services/navbar.service';
import { AsyncPipe, NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { ChannelsService } from '../../services/channels.service';
import { SearchService } from '../../services/search.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatIconModule,
    MatToolbarModule,
    MatDialogModule,
    NgFor,
    AsyncPipe,
    NgIf,
    RouterModule,
    NgClass,
    DatePipe,
    MatProgressSpinnerModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  userProfile = this.firestoreService.userProfile;
  navbarService = inject(NavbarService);
  searchService = inject(SearchService);
  channelService = inject(ChannelsService);

  constructor(
    public dialog: MatDialog,
    private firestoreService: FirestoreService,
    private router: Router
  ) {}

  isOpen = true;
  showChannel = true;
  showMessage = true;

  toggleDrawer() {
    this.isOpen = !this.isOpen;
  }

  openDialog() {
    this.dialog
      .open(NewChannelComponent)
      .afterClosed()
      .subscribe((channelName) => {
        if (!channelName) return;
        this.dialog.open(AddChannelMemberComponent, {
          data: { channelName },
        });
      });
  }

  toNewMessage(){
    this.router.navigateByUrl(`newMessage`);
  }
}
