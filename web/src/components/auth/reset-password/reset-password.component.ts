import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Subject, takeUntil, finalize } from 'rxjs';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  
  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumeric = /\d/.test(value);
  const hasSpecialChar = /[@$!%*?&]/.test(value);
  const isLongEnough = value.length >= 8;
  
  const strength = [hasUpperCase, hasLowerCase, hasNumeric, hasSpecialChar, isLongEnough].filter(Boolean).length;
  
  return strength >= 4 ? null : { weakPassword: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  resetForm: FormGroup;
  loading = false;
  message = '';
  error = '';
  token = '';
  showPassword = false;
  showConfirmPassword = false;
  passwordReset = false;

  constructor() {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.error = 'Invalid or missing reset token.';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit() {
    if (this.resetForm.invalid || !this.token) {
      this.markFormGroupTouched(this.resetForm);
      return;
    }

    this.loading = true;
    this.message = '';
    this.error = '';

    this.authService.resetPassword({
      token: this.token,
      newPassword: this.resetForm.value.password
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          this.passwordReset = true;
          this.message = 'Password reset successful! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 2000);
        },
        error: (err) => {
          console.error('Reset password error:', err);
          if (err.error?.message) {
            this.error = err.error.message;
          } else if (err.status === 400) {
            this.error = 'Invalid or expired reset token. Please request a new password reset.';
          } else if (err.status === 0) {
            this.error = 'Unable to connect to server. Please check your internet connection.';
          } else {
            this.error = 'Failed to reset password. Please try again.';
          }
        }
      });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.resetForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName} is required`;
      }
      if (control.errors['minlength']) {
        return 'Password must be at least 8 characters long';
      }
      if (control.errors['weakPassword']) {
        return 'Password must contain uppercase, lowercase, number, and special character';
      }
      if (control.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }
    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.resetForm.get(fieldName);
    return !!(control && control.errors && control.touched);
  }

  get password() { return this.resetForm.get('password'); }
  get confirmPassword() { return this.resetForm.get('confirmPassword'); }
}
