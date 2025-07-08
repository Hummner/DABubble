import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActionCodeURL, getAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  authService = inject(AuthService);
  router = inject(Router);

  submitted = false;
  auth = getAuth();
  resetPasswordForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  get resetPasswordFormControl() {
    return this.resetPasswordForm.controls;
  }

  get isFormEmpty() {
    const { email } = this.resetPasswordForm.value;
    return !email?.trim();
  }

  onSubmit() {
    this.submitted = true;
    if (this.resetPasswordForm.invalid) {
      return;
    }
    const rawForm = this.resetPasswordForm.getRawValue();
    this.authService
      .sendPasswordResetEmail(
        this.auth,
        rawForm.email!,
        'http://localhost:4200/resetPassword/newPassword'
      )
      .subscribe({
        next: () => {
          console.log('good');
        },
        error: (err) => {
          if (err.code === 'auth/invalid-email') {
            this.resetPasswordForm
              .get('email')
              ?.setErrors({ invalidEmail: true });
          }
        },
      });
  }
}
