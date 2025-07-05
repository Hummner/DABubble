import { Component, EventEmitter, Output } from '@angular/core';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent {

  @Output() close = new EventEmitter<void>

  

}
