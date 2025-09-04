import { Injectable } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { OverlayPositionBuilder, FlexibleConnectedPositionStrategy } from '@angular/cdk/overlay';

export interface ResponsiveMenuOptions {
  mobileBreakpoint: number;
  mobileWidth: string;
  animationInClass: string;
  animationOutClass: string;
  disableAnimation?: boolean;
}

const DEFAULT_OPTIONS: ResponsiveMenuOptions = {
  mobileBreakpoint: 992,
  mobileWidth: '100%',
  animationInClass: 'slide-in',
  animationOutClass: 'slide-out',
};

@Injectable({ providedIn: 'root' })
export class ResponsiveMenuOverlayService {
  constructor(private positionBuilder: OverlayPositionBuilder) {}


  open(trigger: MatMenuTrigger, isMobile: boolean, opts?: Partial<ResponsiveMenuOptions>) {
    trigger.openMenu();
    this.applyStrategy(trigger, isMobile, false, opts);
    if (isMobile) this.animateOpen(trigger, opts);
  }


  reposition(trigger: MatMenuTrigger | undefined, isMobile: boolean, opts?: Partial<ResponsiveMenuOptions>) {
    if (!trigger?.menuOpen) return;
    this.applyStrategy(trigger, isMobile, true, opts);
  }

  handleMenuClosed(trigger: MatMenuTrigger, isMobile: boolean, opts?: Partial<ResponsiveMenuOptions>) {
    if (isMobile) this.animateClose(trigger, opts);
  }


  private applyStrategy(
    trigger: MatMenuTrigger,
    isMobile: boolean,
    resetDesktopClasses: boolean,
    opts?: Partial<ResponsiveMenuOptions>
  ) {
    const overlayRef: any = this.getOverlayRef(trigger);
    if (!overlayRef?.overlayElement) return;
    const options = { ...DEFAULT_OPTIONS, ...opts } as ResponsiveMenuOptions;

    if (isMobile) {
      overlayRef.updatePositionStrategy(this.positionBuilder.global().bottom('0px').left('0px').width(options.mobileWidth));
    } else {
      const hostEl: HTMLElement | null = (trigger as any)?._element || null;
      if (hostEl) {
        const desktop: FlexibleConnectedPositionStrategy = this.positionBuilder
          .flexibleConnectedTo(hostEl)
          .withPositions([
            { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
            { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
          ])
          .withPush(false);
        overlayRef.updatePositionStrategy(desktop);
      }
      if (resetDesktopClasses) {
        const el: HTMLElement = overlayRef.overlayElement;
        el.classList.remove(options.animationInClass, options.animationOutClass);
        el.style.width = '';
      }
    }
    overlayRef.updatePosition();
  }

  private animateOpen(trigger: MatMenuTrigger, opts?: Partial<ResponsiveMenuOptions>) {
    const options = { ...DEFAULT_OPTIONS, ...opts } as ResponsiveMenuOptions;
    if (options.disableAnimation) return;
    const el = this.getOverlayElement(trigger);
    el?.classList.remove(options.animationOutClass);
    el?.classList.add(options.animationInClass);
  }

  private animateClose(trigger: MatMenuTrigger, opts?: Partial<ResponsiveMenuOptions>) {
    const options = { ...DEFAULT_OPTIONS, ...opts } as ResponsiveMenuOptions;
    if (options.disableAnimation) return;
    const el = this.getOverlayElement(trigger);
    if (!el) return;
    el.classList.remove(options.animationInClass);
    el.classList.add(options.animationOutClass);
    setTimeout(() => el.classList.remove(options.animationOutClass), 300);
  }

  private getOverlayRef(trigger: MatMenuTrigger): any | null {
    return (trigger as any)?._overlayRef || null;
  }

  private getOverlayElement(trigger: MatMenuTrigger): HTMLElement | null {
    return this.getOverlayRef(trigger)?.overlayElement || null;
  }
}
