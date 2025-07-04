import { Component } from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatSidenavModule} from '@angular/material/sidenav';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [MatIconModule, MatSidenavModule],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {

  showFiller = false;
}
