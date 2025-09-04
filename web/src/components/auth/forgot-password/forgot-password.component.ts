import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  forgotForm: FormGroup;
  loading = false;
  message = '';
  error = '';
  emailSent = false;

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    console.log('ForgotPasswordComponent: Form submitted');
    
    if (this.forgotForm.invalid) {
      console.log('ForgotPasswordComponent: Form is invalid');
      this.markFormGroupTouched(this.forgotForm);
      return;
    }

    this.loading = true;
    this.message = '';
    this.error = '';

    const email = this.forgotForm.value.email.trim();
    console.log('ForgotPasswordComponent: Calling AuthService with email:', email);

    this.authService.requestPasswordReset({ email })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          this.emailSent = true;
          this.message = 'If an account with this email exists, a password reset link has been sent. Please check your email and follow the instructions.';
        },
        error: (err) => {
          console.error('Forgot password error:', err);
          if (err.error?.message) {
            this.error = err.error.message;
          } else if (err.status === 404) {
            this.error = 'No account found with this email address.';
          } else if (err.status === 429) {
            this.error = 'Too many requests. Please wait a few minutes before trying again.';
          } else if (err.status === 0) {
            this.error = 'Unable to connect to server. Please check your internet connection.';
          } else {
            this.error = 'Something went wrong. Please try again.';
          }
        }
      });
  }

  resendEmail() {
    if (this.forgotForm.valid) {
      this.onSubmit();
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.forgotForm.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return 'Email is required';
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
    }
    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.forgotForm.get(fieldName);
    return !!(control && control.errors && control.touched);
  }
}
