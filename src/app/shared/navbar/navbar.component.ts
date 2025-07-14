import { Component, inject } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NewChannelComponent } from './new-channel/new-channel.component';
import { AddChannelMemberComponent } from './add-channel-member/add-channel-member.component';
import { NavbarService } from '../../services/navbar.service';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';

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
    AsyncPipe
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  private dialog = inject(MatDialog);
  channels$ = inject(NavbarService).channelsObs$;   // <<—  Daten‑Stream

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
