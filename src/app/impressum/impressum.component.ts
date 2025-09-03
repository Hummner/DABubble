import { Component } from '@angular/core';
import { Header2Component } from '../shared/header-2/header-2.component';
import { Router, RouterLink } from '@angular/router';


@Component({
  selector: 'app-impressum',
  standalone: true,
  imports: [Header2Component, RouterLink],
  templateUrl: './impressum.component.html',
  styleUrl: './impressum.component.scss'
})
export class ImpressumComponent {

}
