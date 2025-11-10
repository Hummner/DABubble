import { Injectable } from '@angular/core';
import { Router, NavigationEnd, RouterEvent } from '@angular/router';
import { filter, pairwise } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private previousUrl:string | null = null;
  private currentUrl :string | null = null;
  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        pairwise()
      )
      .subscribe(([prev, curr]) => {
        this.previousUrl = prev.urlAfterRedirects;
        this.currentUrl = curr.urlAfterRedirects;
      });
  }

  getPreviousUrl():string | null {
    return this.previousUrl;
  }
}
