import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { getAuth } from '@angular/fire/auth';
import { NgIf } from '@angular/common';
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
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgIf, Header2Component, FooterComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  authService = inject(AuthService);
  router = inject(Router);
  auth = getAuth();
  submitted = false;
  disabled = true;

  signupForm = new FormGroup({
    name: new FormControl('', [Validators.required, noWhitespaceValidator]),
    email: new FormControl('', [Validators.required, strictEmailValidator, noWhitespaceValidator]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    privacyPolicy: new FormControl('', Validators.requiredTrue),
  });

  errorMessage: string | null = null;

  constructor() {}

  get passwordFormField() {
    return this.signupForm.get('password');
  }

  get signupFormControl() {
    return this.signupForm.controls;
  }

  get isFormEmpty() {
    const { name, email, password, privacyPolicy } = this.signupForm.value;
    return !name?.trim() || !email?.trim() || !password?.trim() || !privacyPolicy;
  }

  get isFormInvalid() {
    return this.signupForm.invalid;
  }

  onSubmit() {
    this.submitted = true;
    const rawForm = this.signupForm.getRawValue();
    this.authService.register(rawForm.name!.trim(), rawForm.email!.trim(), rawForm.password!).subscribe({
      next: () => {
        this.router.navigateByUrl('/avatarSelection');
      },
      error: (err) => {
        if (err.code === 'auth/invalid-email') {
          this.signupForm.get('email')?.setErrors({ invalidEmail: true });
        } else if (err.code === 'auth/wrong-password') {
          this.signupForm.get('password')?.setErrors({ incorrect: true });
        } else if (err.code === 'auth/invalid-credential') {
          this.signupForm.get('password')?.setErrors({ invalid: true });
        }
      },
    });
  }
}
