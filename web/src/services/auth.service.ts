import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of, tap } from 'rxjs';
import { environment } from '../environments/environment';

interface LoginPayload { 
  email: string; 
  password: string; 
}

interface LoginResponse { 
  accessToken: string; 
  refreshToken: string; 
  user: any; 
  twoFactorEnabled?: boolean; 
  requires2FA?: boolean; 
  tempToken?: string; 
}

interface Verify2FARequest { 
  tempToken?: string; 
  totpCode: string; 
}

interface Enable2FARequest { 
  totpCode: string; 
}

interface ForgotPasswordRequest { 
  email: string; 
}

interface ResetPasswordRequest { 
  token: string; 
  newPassword: string; 
}

interface ForgotPasswordResponse { 
  message: string; 
}

interface ResetPasswordResponse { 
  message: string; 
}

interface SetInitialPasswordRequest {
  token: string;
  newPassword: string;
}

interface SetInitialPasswordResponse {
  message: string;
}

const API_BASE = environment.API_BASE_URL;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private get isBrowser(): boolean { return typeof window !== 'undefined' && typeof localStorage !== 'undefined'; }
  private getItem(key: string): string | null { return this.isBrowser ? localStorage.getItem(key) : null; }
  private setItem(key: string, value: string): void { if (this.isBrowser) localStorage.setItem(key, value); }
  private removeItem(key: string): void { if (this.isBrowser) localStorage.removeItem(key); }

  login(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_BASE}/auth/login`, payload).pipe(
      tap((res) => this.storeTokens(res))
    );
  }

  login2FA(payload: LoginPayload): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_BASE}/auth/login-2fa`, payload).pipe(
      tap((res) => this.storeTokens(res))
    );
  }

  verify2FA(body: Verify2FARequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_BASE}/auth/verify-2fa`, body).pipe(
      tap((res) => this.storeTokens(res))
    );
  }

  useRecoveryCode(body: { tempToken?: string; recoveryCode: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${API_BASE}/auth/use-recovery-code`, body).pipe(
      tap((res) => this.storeTokens(res))
    );
  }

  refreshToken(): Observable<boolean> {
    const rt = this.getRefreshToken();
    if (!rt) return of(false);
    return this.http.post<{ accessToken: string; refreshToken: string }>(`${API_BASE}/auth/refresh`, { refreshToken: rt }).pipe(
      tap((res) => {
        this.setItem('accessToken', res.accessToken);
        this.setItem('refreshToken', res.refreshToken);
      }),
      map(() => true)
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${API_BASE}/auth/logout`, {}).pipe(
      tap(() => this.clearTokens())
    );
  }

  get2FASetup(): Observable<any> {
    return this.http.get(`${API_BASE}/auth/2fa/setup`);
  }

  enable2FA(body: Enable2FARequest): Observable<{ message: string; recoveryCodes: string[]; user?: any; token?: string }> {
    return this.http.post<{ message: string; recoveryCodes: string[]; user?: any; token?: string }>(`${API_BASE}/auth/2fa/enable`, body);
  }

  storeRecoveryCodes(codes: string[]): void {
    this.setItem('recoveryCodes', JSON.stringify(codes));
  }

  updateCurrentUser(user: any): void {
    this.setItem('user', JSON.stringify(user));
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getAccessToken(): string | null {
    return this.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return this.getItem('refreshToken');
  }

  get currentUserValue(): any {
    const raw = this.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  // Password Reset Methods - matching your API
  requestPasswordReset(payload: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    console.log('AuthService: Making password reset request to:', `${API_BASE}/auth/request-password-reset`);
    console.log('AuthService: Payload:', payload);
    return this.http.post<ForgotPasswordResponse>(`${API_BASE}/auth/request-password-reset`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${API_BASE}/auth/reset-password`, payload);
  }

  // Set Initial Password - for new users
  setInitialPassword(payload: SetInitialPasswordRequest): Observable<SetInitialPasswordResponse> {
    return this.http.post<SetInitialPasswordResponse>(`${API_BASE}/auth/set-initial-password`, payload);
  }

  private storeTokens(res: LoginResponse): void {
    if (res?.accessToken) this.setItem('accessToken', res.accessToken);
    if (res?.refreshToken) this.setItem('refreshToken', res.refreshToken);
    if (res?.user) this.setItem('user', JSON.stringify(res.user));
  }

  private clearTokens(): void {
    this.removeItem('accessToken');
    this.removeItem('refreshToken');
    this.removeItem('user');
  }
}
