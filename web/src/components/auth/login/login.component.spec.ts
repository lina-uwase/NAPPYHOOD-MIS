import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  // Predefined test credentials
  const testCredentials = {
    valid: {
      email: 'u.lina250@gmail.com',
      password: 'Testing@12!34'
    },
    invalid: {
      email: 'invalid@example.com',
      password: 'wrongpassword' 
    }
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.loginForm.get('emailOrPhone')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginForm.invalid).toBeTruthy();
  });

  it('should validate required fields', () => {
    const emailOrPhoneControl = component.loginForm.get('emailOrPhone');
    const passwordControl = component.loginForm.get('password');

    expect(emailOrPhoneControl?.hasError('required')).toBeTruthy();
    expect(passwordControl?.hasError('required')).toBeTruthy();
  });

  it('should validate password minimum length', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('12345'); // Less than 6 characters
    
    expect(passwordControl?.hasError('minlength')).toBeTruthy();
  });

  it('should login successfully with valid credentials', () => {
   
   const mockResponse = {
  success: true,
  message: 'Login successful',
  token: 'fake-jwt-token',
  refreshToken: 'fake-refresh-token',
  expiresIn: 3600,
  user: {
    id: 1,
    email: 'admin@washmis.gov',
    name: 'Admin User',
    role: 'admin'
  }
};

    component.loginForm.patchValue(testCredentials.valid);

    component.onSubmit();

    expect(mockAuthService.login).toHaveBeenCalledWith(testCredentials.valid);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should handle login failure with invalid credentials', () => {
    
    const mockError = { message: 'Invalid credentials' };
    mockAuthService.login.and.returnValue(throwError(() => mockError));
    spyOn(console, 'error'); 


    component.loginForm.patchValue(testCredentials.invalid);
   
    component.onSubmit();
    
    expect(mockAuthService.login).toHaveBeenCalledWith(testCredentials.invalid);
    expect(console.error).toHaveBeenCalledWith('Login failed', mockError);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should not submit form when invalid', () => {
    
    
    component.onSubmit();

  
    expect(mockAuthService.login).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should enable submit button when form is valid', () => {
    
    const compiled = fixture.nativeElement;
    const submitButton = compiled.querySelector('button[type="submit"]');

 
    expect(submitButton.disabled).toBeTruthy();

   
    component.loginForm.patchValue(testCredentials.valid);
    fixture.detectChanges();

    
    expect(submitButton.disabled).toBeFalsy();
  });

  it('should call onSubmit when form is submitted', () => {
   
    spyOn(component, 'onSubmit');
    const compiled = fixture.nativeElement;
    const form = compiled.querySelector('form');
    
    component.loginForm.patchValue(testCredentials.valid);
    fixture.detectChanges();

    
    form.dispatchEvent(new Event('submit'));

    
    expect(component.onSubmit).toHaveBeenCalled();
  });


  describe('Multiple Credential Tests', () => {
    const credentialSets = [
      { email: 'admin@washmis.gov', password: 'admin123456' },
      { email: '+250788123456', password: 'mobile123' },
      { email: 'manager@district.gov', password: 'manager2024' }
    ];

    credentialSets.forEach((credentials, index) => {
      it(`should handle credential set ${index + 1}`, () => {
        
        const mockResponse = {
  success: true,
  message: 'Login successful',
  token: 'fake-jwt-token',
  refreshToken: 'fake-refresh-token',
  expiresIn: 3600,
  user: {
    id: 1,
    email: 'admin@washmis.gov',
    name: 'Admin User',
    role: 'admin'
  }
};


        
        component.loginForm.patchValue(credentials);
        component.onSubmit();

        
        expect(mockAuthService.login).toHaveBeenCalledWith(credentials);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
      });
    });
  });
});