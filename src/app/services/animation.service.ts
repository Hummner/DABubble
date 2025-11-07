import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AnimationService {
  private firstLoad = true;

  constructor() {}

  isFirstLoad(): boolean {
    if (this.firstLoad) {
      this.firstLoad = false;
      return true;
    }
    return false;
  }
}
