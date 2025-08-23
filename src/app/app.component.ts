import { Component, inject, HostListener, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { HeaderComponent } from './shared/header/header.component';
import { NavbarComponent } from './shared/navbar/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'dabubble';
  router = inject(Router);
  private ngZone = inject(NgZone);

  isAuthLayout = false;
  isNavbarClosed = false;
  windowWidth = window.innerWidth;

  private resizeSubject = new Subject<void>();

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.updateLayoutForRoute(event.urlAfterRedirects);
      }
    });
    this.resizeSubject.pipe(debounceTime(150)).subscribe(() => {
      this.ngZone.runOutsideAngular(() => {
        const newWidth = window.innerWidth;
        const url = this.router.url;
        const hideNavbarRoutes = ['/channel/', '/directMessages/', '/newMessage'];
        const shouldCloseNavbar = newWidth < 992 && hideNavbarRoutes.some(path => url.startsWith(path));
        if (this.windowWidth !== newWidth || this.isNavbarClosed !== shouldCloseNavbar) {
          this.ngZone.run(() => {
            this.windowWidth = newWidth;
            this.isNavbarClosed = shouldCloseNavbar;
          });
        }
      });
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resizeSubject.next();
  }

  private updateLayoutForRoute(url: string) {
    this.isAuthLayout =
      url === '/' ||
      ['/resetPassword', '/signup', '/avatarSelection', '/resetPassword/newPassword'].some(path =>
        url.startsWith(path)
      );
    const hideNavbarRoutes = ['/channel/', '/directMessages/', '/newMessage'];
    const shouldCloseNavbar = hideNavbarRoutes.some(path => url.startsWith(path)) && this.windowWidth < 992;
    this.isNavbarClosed = this.windowWidth < 992 ? shouldCloseNavbar : false;
  }

  onToggleNavbar() {
    this.isNavbarClosed = false;
    if (this.windowWidth >= 992) {
      this.router.navigateByUrl('/channel/1aJzYjqviVDIhmPzxmtc');
    } else {
      this.router.navigateByUrl('/dashboard');
    }
  }

  closeNavbar() {
    this.isNavbarClosed = true;
  }
}

