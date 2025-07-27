import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-thread-direct-message',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './thread-direct-message.component.html',
  styleUrl: './thread-direct-message.component.scss'
})
export class ThreadDirectMessageComponent {
@Input() isThreadOpen!:boolean;
@Output() close = new EventEmitter<void>
}
