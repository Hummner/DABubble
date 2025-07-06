import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.scss'
})
export class TicketComponent {

  @Output() openThread = new EventEmitter<void>;
  @Input() index!: number;

  showPopup = false;
  showMenu = false;
}
