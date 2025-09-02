import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';

interface TwoFASetupResponse {
  qrCode: string;
  manualEntryKey: string;
}

interface Enable2FAResponse {
  message: string;
  recoveryCodes: string[];
  user?: any;
  token?: string;
}

@Component({
  selector: 'app-2fa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './2fa.component.html'
})
export class TwoFAComponent implements OnInit, OnDestroy {
  qrCode = '';
  manualEntryKey = '';
  twoFAForm: FormGroup;
  successMessage = '';
  errorMessage = '';
  recoveryCodes: string[] = [];
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.twoFAForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });
  }

  ngOnInit() {
    // Check if we have a temporary token from login
    const tempToken = localStorage.getItem('tempToken');
    const justSetPassword = localStorage.getItem('justSetPassword');
    if (tempToken) {
      // We're coming from login with 2FA required
      this.isLoading = true;
      this.authService.get2FASetup()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (data: TwoFASetupResponse) => {
            this.qrCode = data.qrCode;
            this.manualEntryKey = data.manualEntryKey;
            this.errorMessage = '';
          },
          error: (error: any) => {
            console.error('2FA setup error:', error);
            this.handleError(error);
          }
        });
    } else if (justSetPassword === 'true') {
      // Allow access to 2FA setup after password set
      localStorage.removeItem('justSetPassword');
      // Optionally, show a message or limited UI
      // You may need to handle API call failure if /auth/2fa/setup requires auth
    } else if (!this.authService.isAuthenticated()) {
      // No temp token and not authenticated
      this.router.navigate(['/login']);
    } else {
      // Regular 2FA setup flow
      this.isLoading = true;
      this.authService.get2FASetup()
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (data: TwoFASetupResponse) => {
            this.qrCode = data.qrCode;
            this.manualEntryKey = data.manualEntryKey;
            this.errorMessage = '';
          },
          error: (error: any) => {
            console.error('2FA setup error:', error);
            this.handleError(error);
          }
        });
    }
  }

  private handleError(error: any): void {
    if (error.status === 401) {
      this.errorMessage = 'Your password was set. Please log in to continue 2FA setup.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000); // Show message for 3 seconds, then redirect
    } else if (error.status === 404) {
      this.errorMessage = 'Backend API not found. Is your server running?';
    } else if (error.status === 0) {
      this.errorMessage = 'Cannot connect to server. Is your backend running?';
    } else {
      this.errorMessage = `Failed to load 2FA setup info. Error: ${error.status} - ${error.message}`;
    }
  }

  enable2FA() {
    if (this.twoFAForm.invalid) {
      this.errorMessage = 'Please enter a valid 6-digit code.';
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = { totpCode: this.twoFAForm.value.code };

    this.authService.enable2FA(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (data: Enable2FAResponse) => {
          this.successMessage = data.message || '2FA enabled successfully!';
          this.recoveryCodes = data.recoveryCodes || [];
          this.errorMessage = '';
          
          // Store recovery codes locally for user access
          if (this.recoveryCodes.length) {
            this.authService.storeRecoveryCodes(this.recoveryCodes);
          }
          
          // Update user data in AuthService
          if (data.user) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            this.authService.updateCurrentUser(data.user);
          }
          if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.removeItem('tempToken'); // Clean up temp token
          }
          
          // Add a small delay to show the success message
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);

          // After successful 2FA setup
          localStorage.removeItem('force2FASetup');
        },
        error: (error: any) => {
          console.error('Enable 2FA error:', error);
          if (error.status === 400) {
            this.errorMessage = 'Invalid code. Please try again.';
          } else if (error.status === 401) {
            this.errorMessage = 'Authentication failed. Please log in again.';
            this.router.navigate(['/login']);
          } else if (error.status === 0) {
            this.errorMessage = 'Cannot connect to server. Please check your internet connection.';
          } else {
            this.errorMessage = error?.error?.message || 'Failed to enable 2FA. Please try again.';
          }
        }
      });
  }

  copyManualEntryKey() {
    if (this.manualEntryKey) {
      navigator.clipboard.writeText(this.manualEntryKey);
    }
  }

  onCodeInput(event: any, idx: number) {
    let value = event.target.value.replace(/[^0-9]/g, '');
    let code = this.twoFAForm.get('code')?.value || '';
    code = code.substring(0, idx) + value + code.substring(idx + 1);
    this.twoFAForm.get('code')?.setValue(code);
    // Move to next input if filled
    if (value && idx < 5) {
      const next = event.target.parentElement.children[idx + 1];
      if (next) next.focus();
    }
  }

  onCodeKeydown(event: any, idx: number) {
    if (event.key === 'Backspace' && !event.target.value && idx > 0) {
      const prev = event.target.parentElement.children[idx - 1];
      if (prev) prev.focus();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}