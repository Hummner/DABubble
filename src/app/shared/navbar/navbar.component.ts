import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NewChannelComponent } from './new-channel/new-channel.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [ MatSidenavModule, MatIconModule, MatToolbarModule, MatDialogModule ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  constructor(public dialog: MatDialog) {}

  showChannel = true;
  showMessage = true;
  isOpen = true;

  toggleDrawer() {
    this.isOpen = !this.isOpen;
  }

  openDialog() {
    const dialogRef = this.dialog.open(NewChannelComponent);

    dialogRef.afterClosed().subscribe(result => {
      console.log(`Dialog result: ${result}`);
    });
  }
}
