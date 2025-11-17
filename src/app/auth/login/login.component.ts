import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { getAuth } from '@angular/fire/auth';
import { FirestoreService } from '../../services/firestore.service';
import { Header2Component } from '../../shared/header-2/header-2.component';
import { FooterComponent } from '../../shared/footer/footer.component';

function noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
  const isWhitespace = (control.value || '').trim().length === 0 && control.value.length > 0;
  return isWhitespace ? { whitespace: true } : null;
}

function strictEmailValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const valid = emailPattern.test(control.value);
  return valid ? null : { email: true };
}

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
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email, strictEmailValidator,noWhitespaceValidator]),
    password: new FormControl('', Validators.required),
  });

  errorMessage: string | null = null;
  emailFocused = false;

  constructor(private fb: FormBuilder) { }

  get loginFormControl() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    if (this.loginForm.invalid) return;
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
        } else if (err.code === 'auth/wrong-password') this.loginForm.get('password')?.setErrors({ incorrect: true });
        else if (err.code === 'auth/invalid-credential') this.loginForm.get('password')?.setErrors({ invalid: true });
        else this.errorMessage = 'An unknown error occurred.';
      },
    });
  }

  get isFormEmpty() {
    const { email, password } = this.loginForm.value;
    return !email?.trim() || !password?.trim();
  }

  guestLogin(event?: Event) {
    event?.preventDefault();
    this.submitted = false;
    this.loginForm.reset();
    this.authService.signInAnonymously().subscribe({
      next: () => {
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
