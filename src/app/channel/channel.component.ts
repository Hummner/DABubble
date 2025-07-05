import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ThreadComponent } from './thread/thread.component';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { ShowMembersComponent } from '../dialogs/show-members/show-members.component';
import { TicketComponent } from '../shared/messages/ticket/ticket.component';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [MatIconModule, MatSidenavModule, ThreadComponent, MatMenuModule, CommonModule, TicketComponent],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {
  readonly dialog = inject(MatDialog);
  showMenu = false;

  openDialog(): void {
    const dialogRef = this.dialog.open(ShowMembersComponent);

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }
}
