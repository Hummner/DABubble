import { Component, OnInit } from '@angular/core';
import { Header2Component } from '../shared/header-2/header-2.component';
import { Router, RouterLink } from '@angular/router';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-datenschutz',
  standalone: true,
  imports: [Header2Component, RouterLink],
  templateUrl: './datenschutz.component.html',
  styleUrl: './datenschutz.component.scss',
})
export class DatenschutzComponent implements OnInit {
  prevUrl!: string | null;

  constructor(private navigationService: NavigationService) {}
  ngOnInit() {
    this.prevUrl = this.navigationService.getPreviousUrl();
    if (this.prevUrl == null || this.prevUrl == '/') {
      this.prevUrl = '/';
    }
    if (this.prevUrl == '/signup') {
      this.prevUrl = '/signup';
    }
  }
}
