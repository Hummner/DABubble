import { Component } from '@angular/core';
import { Header2Component } from '../shared/header-2/header-2.component';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-datenschutz',
  standalone: true,
  imports: [Header2Component, RouterLink],
  templateUrl: './datenschutz.component.html',
  styleUrl: './datenschutz.component.scss',
})
export class DatenschutzComponent {}
