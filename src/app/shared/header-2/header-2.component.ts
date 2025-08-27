import { NgIf } from '@angular/common';
import { AfterViewInit, Component, inject, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-header-2',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './header-2.component.html',
  styleUrl: './header-2.component.scss',
})
export class Header2Component implements OnInit, AfterViewInit, OnDestroy {
  isLoginPage = false;
  private animationStarted = false;
  private viewInitialized = false;
  private destroy$ = new Subject<void>();
  router = inject(Router);
  @ViewChild('greetingContainer') greetingContainer!: ElementRef;
  @ViewChild('greetingName') greetingName!: ElementRef;
  @ViewChild('greeting') greeting!: ElementRef;
  @ViewChild('wholeLogo') wholeLogo!: ElementRef;
  constructor() {}

  ngOnInit(): void {
    this.isLoginPage = this.router.url === '/';
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map((e) => e.urlAfterRedirects === '/'),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((isLogin) => {
        this.isLoginPage = isLogin;
        if (isLogin) {
          this.tryStartAnimation();
        }
      });
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.tryStartAnimation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private tryStartAnimation(): void {
    if (!this.viewInitialized) return;
    if (!this.isLoginPage) return;
    if (this.animationStarted) return;
    this.animationStarted = true;
    this.runGreetingAnimation();
  }

  private runGreetingAnimation(): void {
    setTimeout(() => {
      this.greetingContainer?.nativeElement?.classList.add('slide');
    }, 2200);
    setTimeout(() => {
      this.greetingName?.nativeElement?.classList.add('slide-name');
    }, 1000);
    setTimeout(() => {
      if (this.greetingName?.nativeElement && this.greeting?.nativeElement) {
        this.greetingName.nativeElement.classList.add('changeColor');
        this.greeting.nativeElement.classList.add('hide');
      }
    }, 3000);
    setTimeout(() => {
      if (this.greeting?.nativeElement && this.greetingContainer?.nativeElement) {
        this.greetingContainer.nativeElement.classList.add('animation-finished');
        this.greeting.nativeElement.classList.add('animation-finished-parent');
        this.greetingContainer.nativeElement.classList.remove('slide');
        this.greetingContainer.nativeElement.style.animation = 'none';
      }
    }, 4200);
  }
}
