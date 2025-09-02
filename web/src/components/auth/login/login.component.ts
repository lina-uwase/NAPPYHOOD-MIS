import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Loading states
  isLoading = false;
  is2FALoading = false;

  // Messages
  successMessage: string = '';
  errorMessage: string = '';

  // 2FA state
  twoFARequired = false;
  tempToken?: string;
  showQRCode = false;
  qrCode = '';
  manualEntryKey = '';
  twoFAError = '';

  // Form visibility
  showPassword = false;

  loginForm: FormGroup = this.fb.group({
    emailOrPhone: ['', [Validators.required, this.emailOrPhoneValidator]],
    password: [
      '',
      [
        Validators.required,
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]
    ]
  });

  twoFAForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  emailOrPhoneValidator(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value?.trim();
    if (!value) return null;
    
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isPhone = /^\+?\d{10,15}$/.test(value);
    return isEmail || isPhone ? null : { invalidEmailOrPhone: true };
  }

  onSubmit(): void {
    console.log('LoginComponent: Form submitted');
    this.clearMessages();
    
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      this.errorMessage = 'Please fill out the form correctly.';
      return;
    }

    this.isLoading = true;
    const loginPayload = {
      email: this.loginForm.value.emailOrPhone.trim(),
      password: this.loginForm.value.password,
    };

    console.log('LoginComponent: Calling AuthService login');
    this.authService.login(loginPayload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          console.log('LoginComponent: Login request completed');
        })
      )
      .subscribe({
        next: (response) => {
          console.log('LoginComponent: Login response received:', response);
          const force2FASetup = localStorage.getItem('force2FASetup');
          if (force2FASetup === 'true') {
            localStorage.removeItem('force2FASetup');
            this.router.navigate(['/setup-2fa']);
            return;
          }
          if (response.requires2FASetup) {
            this.router.navigate(['/setup-2fa']);
            return;
          }
          if (response.requires2FA) {
            if (response.tempToken) {
              localStorage.setItem('tempToken', response.tempToken);
            }
            this.router.navigate(['/verify-2fa']);
            return;
          } else {
            console.log('LoginComponent: Login successful, redirecting to dashboard');
            this.handleSuccessfulLogin('User logged in successfully!');
          }
        },
        error: (error) => {
          console.error('LoginComponent: Login error:', error);
          this.handleLoginError(error);
        }
      });
  }

  private handleSuccessfulLogin(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    
    // Verify authentication state before redirect
    console.log('LoginComponent: Verifying auth state before redirect');
    console.log('LoginComponent: Is authenticated:', this.authService.isAuthenticated());
    console.log('LoginComponent: Current user:', this.authService.currentUserValue);
    
    setTimeout(() => {
      this.router.navigate(['/app/dashboard']).then(success => {
        if (success) {
          console.log('LoginComponent: Successfully navigated to dashboard');
        } else {
          console.error('LoginComponent: Failed to navigate to dashboard');
        }
      });
    }, 1500);
  }

  private handleLoginError(error: any): void {
    console.error('LoginComponent: Handling login error:', error);
    
    // Handle specific error messages from backend
    if (error.error?.message) {
      this.errorMessage = error.error.message;
    } else if (error.status === 401) {
      this.errorMessage = 'Invalid credentials. Please check your email/phone and password.';
    } else if (error.status === 429) {
      this.errorMessage = 'Too many login attempts. Please try again later.';
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to server. Please check your internet connection.';
    } else {
      this.errorMessage = 'Login failed. Please try again.';
    }
    
    this.successMessage = '';
  }

  submit2FA(): void {
    console.log('LoginComponent: 2FA form submitted');
    this.twoFAError = '';
    
    if (this.twoFAForm.invalid) {
      this.markFormGroupTouched(this.twoFAForm);
      this.twoFAError = 'Please enter a valid 6-digit code.';
      return;
    }

    this.is2FALoading = true;
    const code = this.twoFAForm.value.code;
    
    console.log('LoginComponent: Calling AuthService verify2FA');
    this.authService.verify2FA({ tempToken: this.tempToken, totpCode: code })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.is2FALoading = false;
          console.log('LoginComponent: 2FA verification completed');
        })
      )
      .subscribe({
        next: (response) => {
          console.log('LoginComponent: 2FA verification successful:', response);
          
          this.successMessage = '2FA successful! Logging in...';
          this.twoFAError = '';
          
          // Verify authentication state after 2FA
          console.log('LoginComponent: Verifying auth state after 2FA');
          console.log('LoginComponent: Is authenticated:', this.authService.isAuthenticated());
          console.log('LoginComponent: Current user:', this.authService.currentUserValue);
          
          setTimeout(() => {
            this.router.navigate(['/app/dashboard']).then(success => {
              if (success) {
                console.log('LoginComponent: Successfully navigated to dashboard after 2FA');
              } else {
                console.error('LoginComponent: Failed to navigate to dashboard after 2FA');
              }
            });
          }, 1500);
        },
        error: (error) => {
          console.error('LoginComponent: 2FA verification error:', error);
          
          if (error.error?.message) {
            this.twoFAError = error.error.message;
          } else if (error.status === 401) {
            this.twoFAError = 'Invalid 2FA code. Please try again.';
          } else {
            this.twoFAError = 'Failed to verify 2FA code. Please try again.';
          }
        }
      });
  }

  // Optional: Fetch QR code for 2FA setup
  fetchQRCode(): void {
    console.log('LoginComponent: Fetching QR code for 2FA setup');
    this.authService.get2FASetup().subscribe({
      next: (data) => {
        console.log('LoginComponent: QR code fetched successfully');
        this.qrCode = data.qrCode;
        this.manualEntryKey = data.manualEntryKey;
        this.showQRCode = true;
      },
      error: (err) => {
        console.error('LoginComponent: Failed to fetch QR code:', err);
        this.twoFAError = 'Failed to load QR code for 2FA setup.';
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.twoFAError = '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Helper method to get form control errors
  getFieldError(fieldName: string, formGroup: FormGroup = this.loginForm): string {
    const control = formGroup.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName} is required`;
      }
      if (control.errors['invalidEmailOrPhone']) {
        return 'Please enter a valid email or phone number';
      }
      if (control.errors['pattern']) {
        if (fieldName === 'password') {
          return 'Password must be at least 8 characters with uppercase, number, and special character';
        }
        if (fieldName === 'code') {
          return 'Please enter a 6-digit code';
        }
      }
    }
    return '';
  }

  // Helper method to check if field has error
  hasFieldError(fieldName: string, formGroup: FormGroup = this.loginForm): boolean {
    const control = formGroup.get(fieldName);
    return !!(control && control.errors && control.touched);
  }
}