import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  const apiReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(apiReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && authService.getRefreshToken()) {
        return authService.refreshToken().pipe(
          switchMap((ok) => {
            const newToken = authService.getAccessToken();
            const retried = newToken ? apiReq.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }) : apiReq;
            return next(retried);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
