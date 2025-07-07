import { Component } from '@angular/core';
import {MatSidenavModule} from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import {MatToolbarModule} from '@angular/material/toolbar';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [ MatSidenavModule, MatIconModule, MatToolbarModule ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  showFiller = true;
  isOpen = true;


  toggleDrawer() {
    this.isOpen = !this.isOpen;
  }
}
