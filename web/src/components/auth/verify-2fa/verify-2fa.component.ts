import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-verify-2fa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './verify-2fa.component.html',
  styleUrls: ['./verify-2fa.component.css']
})
export class Verify2FAComponent implements OnDestroy {
  twoFAForm: FormGroup;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.twoFAForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submit2FA() {
    this.errorMessage = '';
    this.successMessage = '';
    
    if (this.twoFAForm.invalid) {
      this.errorMessage = 'Please enter a valid 6-digit code.';
      return;
    }

    const tempToken = localStorage.getItem('tempToken');
    if (!tempToken) {
      this.errorMessage = 'Session expired. Please log in again.';
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;
    this.authService.verify2FA({ tempToken, totpCode: this.twoFAForm.value.code })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('2FA verification response:', response);
          this.successMessage = 'Verification successful! Redirecting...';
          localStorage.removeItem('tempToken');
          
          if (response.user) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.authService.updateCurrentUser(response.user);
          }
          
          setTimeout(() => {
            this.router.navigate(['/app/dashboard']);
          }, 1500);
        },
        error: (error) => {
          console.error('2FA verification error:', error);
          if (error.status === 401) {
            this.errorMessage = 'Invalid code. Please try again.';
          } else if (error.status === 0) {
            this.errorMessage = 'Cannot connect to server. Please check your internet connection.';
          } else {
            this.errorMessage = error?.error?.message || 'Verification failed. Please try again.';
          }
        }
      });
  }
} 