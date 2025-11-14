import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-log-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './log-message.component.html',
  styleUrl: './log-message.component.scss',
})
export class LogMessageComponent {
  @Input() message = 'Standardprotokollmeldung';
  visible = false;
  show(duration = 3000) {
    this.visible = true;
    setTimeout(() => (this.visible = false), duration);
  }
}
