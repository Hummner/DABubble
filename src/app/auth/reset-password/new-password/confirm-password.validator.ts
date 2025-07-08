import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const confirmPasswordValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password_1')?.value;
  const confirmPassword = control.get('password_2')?.value;

  return password === confirmPassword ? null : { PasswordNoMatch: true };
};
