import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit {
  // @ViewChild('greetingContainer') greetingContainer!: ElementRef;
  @ViewChild('greeting') greeting!: ElementRef;
  // @ViewChild('headerLogo') headerLogo!: ElementRef;

  ngAfterViewInit(): void {
    // const greetingContainer = this.greetingContainer
    //   .nativeElement as HTMLElement;
    // const target = this.headerLogo.nativeElement as HTMLElement;
    // const targetRect = target.getBoundingClientRect();
    // const containerRect = greetingContainer.getBoundingClientRect();

    // const deltaX =
    //   targetRect.left +
    //   targetRect.width / 2 -
    //   (containerRect.left + containerRect.width / 2);
    // const deltaY =
    //   targetRect.top +
    //   targetRect.height / 2 -
    //   (containerRect.top + containerRect.height / 2);
    // const scale = targetRect.width / containerRect.width;

    // setTimeout(() => {
    //   greetingContainer.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scale})`;
    // }, 3000);

    setTimeout(() => {
      this.greeting.nativeElement.classList.add('hide');
    }, 3500);
  }
}
