import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { getAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit {
  authService = inject(AuthService);
  router = inject(Router);
  auth = getAuth();
  user = this.auth.currentUser;

  form = new FormGroup({
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });

  errorMessage: string | null = null;

  constructor() {}

  onSubmit() {
    const rawForm = this.form.getRawValue();
    this.authService.login(rawForm.email!, rawForm.password!).subscribe({
      next: () => {
        this.router.navigateByUrl('channel');
      },
      error: (err) => {
        this.errorMessage = err.code;
      },
    });
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
    // setTimeout(() => {
    //   this.greeting.nativeElement.classList.add('hide');
    // }, 3500);
  }
}
