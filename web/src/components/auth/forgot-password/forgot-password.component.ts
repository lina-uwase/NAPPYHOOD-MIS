import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  loading = false;
  message = '';
  error = '';

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;
    this.loading = true;
    this.message = '';
    this.error = '';
    this.http.post<any>('http://localhost:8080/api/v1/auth/request-password-reset', this.forgotForm.value)
      .subscribe({
        next: () => {
          this.message = 'If the email exists, a password reset link has been sent.';
          this.loading = false;
        },
        error: err => {
          this.error = err.error?.message || 'Something went wrong.';
          this.loading = false;
        }
      });
  }
}
