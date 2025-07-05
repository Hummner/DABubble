import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-avatar-selection',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss',
})
export class AvatarSelectionComponent {
  currentProfilImageUrl = '';
  profileImageChosen = false;

  profileImageUrls = [
    'assets/img/elias_neumann.svg',
    'assets/img/elise_roth.svg',
    'assets/img/frederik_beck.svg',
    'assets/img/noah_braun.svg',
    'assets/img/sofia_müller.svg',
    'assets/img/steffen_hoffmann.svg',
  ];

  chooseProfilImg(src: string) {
    console.log('chosen img', src);
    this.currentProfilImageUrl = src;
    this.profileImageChosen = true;
  }
}
