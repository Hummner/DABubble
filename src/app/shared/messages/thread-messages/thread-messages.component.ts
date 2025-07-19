import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketInterface } from '../../../interfaces/ticket.interface';

@Component({
  selector: 'app-thread-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './thread-messages.component.html',
  styleUrl: './thread-messages.component.scss'
})
export class ThreadMessagesComponent {

  @Input() tickets!: TicketInterface[];
  userName!: string;

    isCurrentUser() {
  return true
}

}
