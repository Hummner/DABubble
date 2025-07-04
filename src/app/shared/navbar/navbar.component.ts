import { Component } from '@angular/core';
import {MatSidenavModule} from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [ MatSidenavModule, MatIconModule ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  showFiller = false;
  isOpen = true;


  toggleDrawer() {
    this.isOpen = !this.isOpen;
  }
}
