import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value || '';
  // At least 8 chars, one uppercase, one lowercase, one number, one special char
  const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(value);
  return strong ? null : { strongPassword: true };
}

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './set-password.component.html'
})
export class SetPasswordComponent implements OnInit {
  setForm: FormGroup;
  loading = false;
  message = '';
  error = '';
  token = '';
  apiUrl = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {
    this.setForm = this.fb.group({
      password: ['', [Validators.required, strongPasswordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.router.navigate(['/auth/login']);
      }
    });

    // Detect which API to use based on the route
    const currentRoute = this.router.url.split('?')[0];
    if (currentRoute === '/auth/set-password') {
      this.apiUrl = 'http://localhost:8080/api/v1/auth/set-initial-password';
    } 
  }

  onSubmit() {
    if (this.setForm.invalid || !this.token) return;
    this.loading = true;
    this.message = '';
    this.error = '';

    // Prepare the payload based on the API
    let payload: any = { token: this.token };
    if (this.apiUrl.endsWith('set-initial-password')) {
      payload.password = this.setForm.value.password;
    } else {
      payload.newPassword = this.setForm.value.password;
    }

    this.http.post<any>(this.apiUrl, payload).subscribe({
      next: () => {
        this.message = 'Password set successfully! Redirecting to login...';
        this.loading = false;
        localStorage.setItem('force2FASetup', 'true');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: err => {
        this.error = err.error?.message || 'Invalid or expired token.';
        this.loading = false;
      }
    });
  }

  get password() { return this.setForm.get('password'); }
  get confirmPassword() { return this.setForm.get('confirmPassword'); }
}