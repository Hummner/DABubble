import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [MatCardModule, NgIf],
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.scss',
})
export class UserCardComponent {
  @Input() userProfileB!: UserProfileInterface | null;
  @Input() profileOpen = false;
  @Output() closeProfile = new EventEmitter<void>();

  onCloseClick() {
    this.closeProfile.emit();
  }
}
