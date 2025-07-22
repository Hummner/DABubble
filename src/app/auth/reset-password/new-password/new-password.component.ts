import { confirmPasswordValidator } from './confirm-password.validator';
import { AuthService } from '../../../services/auth.service';
import { Component, inject, OnInit } from '@angular/core';
import { StrongPasswordRegx } from '../../signup/strong-password.pattern';
import {
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  getAuth,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from '@angular/fire/auth';
import { FooterComponent } from '../../../shared/footer/footer.component';
import { Header2Component } from '../../../shared/header-2/header-2.component';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, FooterComponent, Header2Component, NgIf],
  templateUrl: './new-password.component.html',
  styleUrl: './new-password.component.scss',
})
export class NewPasswordComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  submitted = false;
  auth = getAuth();

  oobCode: string = '';
  email: string | null = null;
  errorMessage: string | null = null;

  newPasswordForm = new FormGroup(
    {
      password_1: new FormControl('', [Validators.required,Validators.pattern(StrongPasswordRegx)]),
      password_2: new FormControl('', [Validators.required,Validators.pattern(StrongPasswordRegx)]),
    },
    { validators: confirmPasswordValidator }
  );

  get isFormEmpty() {
    const { password_1, password_2 } = this.newPasswordForm.value;
    return !password_1?.trim() || !password_2?.trim();
  }

  ngOnInit() {
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode') || '';

    if (!this.oobCode) {
      this.errorMessage = 'Invalid or missing reset code.';
      return;
    }

    verifyPasswordResetCode(this.auth, this.oobCode)
      .then((email: string) => {
        this.email = email;
      })
      .catch(() => {
        this.errorMessage = 'This password reset link is invalid or expired.';
      });
  }

  onSubmit() {
    this.submitted = true;

    if (this.newPasswordForm.invalid || !this.oobCode) {
      return;
    }

    const newPassword = this.newPasswordForm.value.password_1!;
    confirmPasswordReset(this.auth, this.oobCode, newPassword)
      .then(() => this.router.navigate(['/']))
      .catch((err) => {
        if (err.code === 'auth/weak-password') {
          this.newPasswordForm.get('password_1')?.setErrors({ weak: true });
        }
      });
  }
}
