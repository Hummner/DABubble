import { NgIf } from '@angular/common';
import { AfterViewInit, Component, inject, ViewChild, ElementRef, OnInit, OnDestroy, AfterViewChecked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { AnimationService } from '../../services/animation.service';

@Component({
  selector: 'app-header-2',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './header-2.component.html',
  styleUrl: './header-2.component.scss',
})
export class Header2Component implements OnInit, AfterViewInit, OnDestroy, AfterViewChecked {
  isLoginPage = false;
  private animationStarted = false;
  private viewInitialized = false;
  private destroy$ = new Subject<void>();
  router = inject(Router);
  @ViewChild('greetingContainer', { static: false }) greetingContainer!: ElementRef;
  @ViewChild('greetingName', { static: false }) greetingName!: ElementRef;
  @ViewChild('greeting', { static: false }) greeting!: ElementRef;
  @ViewChild('wholeLogo', { static: false }) wholeLogo!: ElementRef;
  showAnimation: boolean = false;

  constructor(private animation: AnimationService) {}

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
        if (isLogin && this.showAnimation === true) this.tryStartAnimation();
      });
    this.showAnimation = this.animation.isFirstLoad();
  }

  ngAfterViewChecked(): void {
    if (this.isLoginPage && !this.animationStarted && this.greetingContainer && this.greetingName) {
      if (this.showAnimation === true) {
        this.runGreetingAnimation();
      } else {
        this.everythingWithoutAnimation();
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.showAnimation == true) {
      this.viewInitialized = true;
      setTimeout(() => this.tryStartAnimation(), 50);
    }
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
    this.addSlideClassToLogo();
    this.addSlideClassToName();
    this.addColorClassToName();
    this.finalizeLogo();
  }

  addSlideClassToLogo() {
    setTimeout(() => {
      if (this.greetingContainer?.nativeElement) {
        this.greetingContainer.nativeElement.classList.add('slide');
      }
    }, 2200);
  }

  addSlideClassToName() {
    setTimeout(() => {
      if (this.greetingName?.nativeElement) {
        this.greetingName.nativeElement.classList.add('slide-name');
      }
    }, 1000);
  }

  addColorClassToName() {
    setTimeout(() => {
      if (this.greetingName?.nativeElement && this.greeting?.nativeElement) {
        this.greetingName.nativeElement.classList.add('changeColor');
        this.greeting.nativeElement.classList.add('hide');
      }
    }, 3000);
  }

  finalizeLogo() {
    setTimeout(() => {
      if (this.greeting?.nativeElement && this.greetingContainer?.nativeElement) {
        this.greetingContainer.nativeElement.classList.add('animation-finished');
        this.greeting.nativeElement.classList.add('animation-finished-parent');
        this.greetingContainer.nativeElement.classList.remove('slide');
        this.greetingContainer.nativeElement.style.animation = 'none';
      }
    }, 4200);
  }

  everythingWithoutAnimation() {
    this.greetingContainer.nativeElement.classList.add('animation-finished');
    this.greeting.nativeElement.classList.add('animation-finished-parent');
    this.greetingContainer.nativeElement.classList.remove('slide');
    this.greeting.nativeElement.classList.add('hide');
    this.greetingContainer.nativeElement.style.animation = 'none';
    this.greetingName.nativeElement.classList.add('blackText');
  }
}
