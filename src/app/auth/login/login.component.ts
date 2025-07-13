import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { getAuth } from '@angular/fire/auth';
import { FirestoreService } from '../../services/firestore.service';

import { Header2Component } from '../../shared/header-2/header-2.component';
import { FooterComponent } from '../../shared/footer/footer.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, Header2Component, FooterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit {
  authService = inject(AuthService);
  router = inject(Router);
  auth = getAuth();
  user = this.auth.currentUser;
  submitted = false;
  fireStore = inject(FirestoreService);

  loginForm = new FormGroup({
    email: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.email,
    ]),
    password: new FormControl('', Validators.required),
  });

  errorMessage: string | null = null;

  constructor(private fb: FormBuilder) {}

  get loginFormControl() {
    return this.loginForm.controls;
  }
  onSubmit() {
    this.submitted = true;
    const rawForm = this.loginForm.getRawValue();
    this.authService.login(rawForm.email!, rawForm.password!).subscribe({
      next: () => {
        this.router.navigateByUrl('channel');
      },
      error: (err) => {
        if (err.code === 'auth/invalid-email') {
          this.loginForm.get('email')?.setErrors({ invalidEmail: true });
        } else if (err.code === 'auth/wrong-password') {
          this.loginForm.get('password')?.setErrors({ incorrect: true });
        } else if (err.code === 'auth/invalid-credential') {
          this.loginForm.get('password')?.setErrors({ invalid: true });
        } else {
          this.errorMessage = 'An unknown error occurred.';
        }
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

  guestLogin() {
    this.authService.signInAnonymously().subscribe({
      next: () => {
        console.log('Anonymous login successful');
        this.router.navigateByUrl('channel');
        const uid = this.auth.currentUser?.uid;
        if (uid) {
          this.fireStore.getGuestLoginData(uid);
        }
      },
      error: (err) => console.error('Anonymous login error:', err),
    });
  }
}
