import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit {
  userForm!: FormGroup;

  constructor() {
    this.userForm = new FormGroup({
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', Validators.required),
    });
  }

  onSubmit() {
    console.log(this.userForm.value);
  }
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
