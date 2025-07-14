import { Component } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { TicketComponent } from '../shared/messages/ticket/ticket.component';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-direct-messages',
  standalone: true,
  imports: [MatSidenavModule, MatIconModule, MatMenuModule],
  templateUrl: './direct-messages.component.html',
  styleUrl: './direct-messages.component.scss',
})
export class DirectMessagesComponent {
  directMsgId!:string;

  ngOnInit():void {
    
  }
  constructor(private route: ActivatedRoute) {}
}
