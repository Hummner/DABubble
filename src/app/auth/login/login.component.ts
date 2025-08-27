import { AfterViewInit, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
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
export class LoginComponent {
  authService = inject(AuthService);
  router = inject(Router);
  auth = getAuth();
  user = this.auth.currentUser;
  submitted = false;
  fireStore = inject(FirestoreService);

  loginForm = new FormGroup({
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
  });

  errorMessage: string | null = null;
  emailFocused = false;

  constructor(private fb: FormBuilder) {}

  get loginFormControl() {
    return this.loginForm.controls;
  }
  onSubmit() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }
    const rawForm = this.loginForm.getRawValue();
    this.authService.login(rawForm.email!, rawForm.password!).subscribe({
      next: () => {
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        if (err.code === 'auth/invalid-email') {
          const control = this.loginForm.get('email');
          const existing = control?.errors || {};
          control?.setErrors({ ...existing, invalidEmail: true });
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
  // @ViewChild('greetingName') greetingName!: ElementRef;
  // @ViewChild('greeting') greeting!: ElementRef;
  // @ViewChild('wholeLogo') wholeLogo!: ElementRef;

  // ngAfterViewInit(): void {
  //   setTimeout(() => {
  //     this.greetingContainer.nativeElement.classList.add('slide');
  //   }, 2200);
  //   setTimeout(() => {
  //     this.greetingName.nativeElement.classList.add('slide-name');
  //   }, 1000);
  //   setTimeout(() => {
  //     this.greetingName.nativeElement.classList.add('changeColor');
  //     this.greeting.nativeElement.classList.add('hide');
  //   }, 3000);
  // }

  guestLogin() {
    this.authService.signInAnonymously().subscribe({
      next: () => {
        console.log('Anonymous login successful');
        this.router.navigateByUrl('/dashboard');
        const uid = this.auth.currentUser?.uid;
        if (uid) {
          this.fireStore.getGuestLoginData(uid);
        }
      },
      error: (err) => console.error('Anonymous login error:', err),
    });
  }
}
