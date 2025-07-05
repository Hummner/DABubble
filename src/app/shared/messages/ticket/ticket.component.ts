import { Component, EventEmitter, Input, input, Output } from '@angular/core';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.scss'
})
export class TicketComponent {

  @Output() openThread = new EventEmitter<void>;
  @Input() index!: number
;
}
