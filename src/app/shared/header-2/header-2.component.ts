import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-header-2',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './header-2.component.html',
  styleUrl: './header-2.component.scss',
})
export class Header2Component {
  isLoginPage = false;
  router = inject(Router);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;
        this.isLoginPage = url === '/';
      }
    });
  }
}
