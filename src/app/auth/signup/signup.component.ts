import { Component, inject } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  authService = inject(AuthService);
  router = inject(Router);

  form = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });

  errorMessage: string | null = null;

  constructor() {}

  onSubmit() {
    console.log(this.form.value);
    const rawForm = this.form.getRawValue();
    this.authService
      .register(rawForm.name!, rawForm.email!, rawForm.password!)
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/avatarSelection');
        },
        error: (err) => {
          this.errorMessage = err.code;
        },
      });
  }
}
