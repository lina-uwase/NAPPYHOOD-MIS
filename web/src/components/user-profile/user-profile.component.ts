import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { environment } from '../../environments/environment';
import { AuthService } from '../../services/auth.service';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  telephoneNumber: string;
  role: {
    id: string;
    name: string;
    privileges: string[];
  };
  accountVerified: boolean;
  is2FAEnabled: boolean;
  locations: LocationResponse[];
  createdAt: string;
  updatedAt: string;
  // For form binding
  provinceId?: string;
  districtId?: string;
  sectorId?: string;
  cellId?: string;
  villageId?: string;
}

interface LocationResponse {
  id: string;
  province?: {
    id: number;
    code: number;
    name: string;
  };
  district?: {
    id: number;
    code: number;
    name: string;
    provinceId: number;
  };
  sector?: {
    id: number;
    code: number;
    name: string;
    districtId: number;
  };
  cell?: {
    id: number;
    code: number;
    name: string;
    sectorId: number;
  };
  village?: {
    id: number;
    code: number;
    name: string;
    cellId: number;
  };
}

interface SelectOption {
  label: string;
  value: string | number;
}

interface UserUpdateRequest {
  firstName: string;
  lastName: string;
  telephoneNumber: string;
  is2FAEnabled?: boolean;
  locations: {
    provinceId: number;
    districtId: number;
    sectorId: number;
    cellId: number;
    villageId: number;
  }[];
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    ToastModule,
    CardModule,
    DividerModule,
    AvatarModule,
    ConfirmDialogModule,
    TooltipModule,
    DialogModule
  ],
  providers: [
    MessageService,
    ConfirmationService
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  // User profile data
  userProfile: UserProfile = this.createEmptyProfile();
  originalProfile: UserProfile = this.createEmptyProfile();
  
  // Form states
  loading = false;
  saving = false;
  submitted = false;
  editMode = false;
  
  // Location dropdowns
  provinces: SelectOption[] = [];
  districts: SelectOption[] = [];
  sectors: SelectOption[] = [];
  cells: SelectOption[] = [];
  villages: SelectOption[] = [];
  
  // Loading states for dropdowns
  loadingProvinces = false;
  loadingDistricts = false;
  loadingSectors = false;
  loadingCells = false;
  loadingVillages = false;

  show2FADialog = false;
  totpCode = '';
  processing2FA = false;
  twoFAAction: 'enable' | 'disable' = 'disable';

  constructor(
    private http: HttpClient,
    public messageService: MessageService,
    private confirmationService: ConfirmationService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('UserProfileComponent: Initializing component');
    console.log('UserProfileComponent: User authenticated:', this.authService.isAuthenticated());
    console.log('UserProfileComponent: Token exists:', !!this.authService.getAccessToken());
    
    this.loadUserProfile();
    this.fetchProvinces();
  }

  private createEmptyProfile(): UserProfile {
    return {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      telephoneNumber: '',
      role: {
        id: '',
        name: '',
        privileges: []
      },
      accountVerified: false,
      is2FAEnabled: false,
      locations: [],
      createdAt: '',
      updatedAt: ''
    };
  }

  loadUserProfile(): void {
    this.loading = true;
    const apiUrl = `${environment.API_BASE_URL}/users/me`;
    
    console.log('UserProfileComponent: Loading user profile from:', apiUrl);
    console.log('UserProfileComponent: Token will be added by interceptor:', !!this.authService.getAccessToken());
    
    this.http.get<UserProfile>(apiUrl).subscribe({
      next: (response) => {
        console.log('UserProfileComponent: Raw API response:', response);
        this.userProfile = { ...response };
        this.originalProfile = { ...response };
        
        // Extract location IDs for form binding
        this.extractLocationIds();
        
        console.log('UserProfileComponent: Profile loaded successfully:', this.userProfile);
        this.loading = false;
      },
      error: (error) => {
        console.error('UserProfileComponent: Error loading user profile:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.status === 401 ? 'Unauthorized - Please login again' : 'Failed to load profile'
        });
        this.loading = false;
      }
    });
  }

  private extractLocationIds(): void {
    if (this.userProfile.locations && this.userProfile.locations.length > 0) {
      const location = this.userProfile.locations[0];
      
      console.log('UserProfileComponent: Extracting location IDs from:', location);
      
      this.userProfile.provinceId = location.province?.id ? String(location.province.id) : undefined;
      this.userProfile.districtId = location.district?.id ? String(location.district.id) : undefined;
      this.userProfile.sectorId = location.sector?.id ? String(location.sector.id) : undefined;
      this.userProfile.cellId = location.cell?.id ? String(location.cell.id) : undefined;
      this.userProfile.villageId = location.village?.id ? String(location.village.id) : undefined;
      
      console.log('UserProfileComponent: Extracted location IDs:', {
        provinceId: this.userProfile.provinceId,
        districtId: this.userProfile.districtId,
        sectorId: this.userProfile.sectorId,
        cellId: this.userProfile.cellId,
        villageId: this.userProfile.villageId
      });
    }
  }

  fetchProvinces(): void {
    this.loadingProvinces = true;
    const apiUrl = `${environment.API_BASE_URL}/provinces`;
    const params = new HttpParams().set('page', '1').set('limit', '100');

    console.log('UserProfileComponent: Fetching provinces from:', apiUrl);

    this.http.get<any>(apiUrl, { params }).subscribe({
      next: (response) => {
        console.log('UserProfileComponent: Raw provinces response:', response);
        
        let provincesArray: any[] = Array.isArray(response)
          ? response
          : response?.provinces || response?.data || [];

        this.provinces = provincesArray.map((province: any) => ({
          label: province.name,
          value: String(province.id)
        }));
        
        console.log('UserProfileComponent: Provinces mapped:', this.provinces);
        this.loadingProvinces = false;
      },
      error: (error) => {
        console.error('UserProfileComponent: Error fetching provinces:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load provinces'
        });
        this.loadingProvinces = false;
      }
    });
  }

  fetchDistrictsByProvince(provinceId: string): void {
    this.loadingDistricts = true;
    const apiUrl = `${environment.API_BASE_URL}/districts`;
    const params = new HttpParams()
      .set('page', '1')
      .set('limit', '100')
      .set('provinceId', provinceId);

    console.log('UserProfileComponent: Fetching districts for province:', provinceId);

    this.http.get<any>(apiUrl, { params }).subscribe({
      next: (response) => {
        let districtsArray: any[] = Array.isArray(response)
          ? response
          : response?.districts || response?.data || [];

        this.districts = districtsArray.map((district: any) => ({
          label: district.name,
          value: String(district.id)
        }));
        
        console.log('UserProfileComponent: Districts mapped:', this.districts);
        this.loadingDistricts = false;
      },
      error: (error) => {
        console.error('UserProfileComponent: Error fetching districts:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load districts'
        });
        this.loadingDistricts = false;
      }
    });
  }

  fetchSectorsByDistrict(districtId: string): void {
    this.loadingSectors = true;
    const apiUrl = `${environment.API_BASE_URL}/sectors`;
    const params = new HttpParams()
      .set('page', '1')
      .set('limit', '100')
      .set('districtId', districtId);

    console.log('UserProfileComponent: Fetching sectors for district:', districtId);

    this.http.get<any>(apiUrl, { params }).subscribe({
      next: (response) => {
        let sectorsArray: any[] = Array.isArray(response)
          ? response
          : response?.sectors || response?.data || [];

        this.sectors = sectorsArray.map((sector: any) => ({
          label: sector.name,
          value: String(sector.id)
        }));
        
        console.log('UserProfileComponent: Sectors mapped:', this.sectors);
        this.loadingSectors = false;
      },
      error: (error) => {
        console.error('UserProfileComponent: Error fetching sectors:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load sectors'
        });
        this.loadingSectors = false;
      }
    });
  }

  fetchCellsBySector(sectorId: string): void {
    this.loadingCells = true;
    const apiUrl = `${environment.API_BASE_URL}/cells`;
    const params = new HttpParams()
      .set('page', '1')
      .set('limit', '100')
      .set('sectorId', sectorId);

    console.log('UserProfileComponent: Fetching cells for sector:', sectorId);

    this.http.get<any>(apiUrl, { params }).subscribe({
      next: (response) => {
        let cellsArray: any[] = Array.isArray(response)
          ? response
          : response?.cells || response?.data || [];

        this.cells = cellsArray.map((cell: any) => ({
          label: cell.name,
          value: String(cell.id)
        }));
        
        console.log('UserProfileComponent: Cells mapped:', this.cells);
        this.loadingCells = false;
      },
      error: (error) => {
        console.error('UserProfileComponent: Error fetching cells:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load cells'
        });
        this.loadingCells = false;
      }
    });
  }

  fetchVillagesByCell(cellId: string): void {
    this.loadingVillages = true;
    const apiUrl = `${environment.API_BASE_URL}/villages`;
    const params = new HttpParams()
      .set('page', '1')
      .set('limit', '100')
      .set('cellId', cellId);

    console.log('UserProfileComponent: Fetching villages for cell:', cellId);

    this.http.get<any>(apiUrl, { params }).subscribe({
      next: (response) => {
        let villagesArray: any[] = Array.isArray(response)
          ? response
          : response?.villages || response?.data || [];

        this.villages = villagesArray.map((village: any) => ({
          label: village.name,
          value: String(village.id)
        }));
        
        console.log('UserProfileComponent: Villages mapped:', this.villages);
        this.loadingVillages = false;
      },
      error: (error) => {
        console.error('UserProfileComponent: Error fetching villages:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load villages'
        });
        this.loadingVillages = false;
      }
    });
  }

  private loadLocationDataForEdit(): void {
    if (!this.userProfile.provinceId) {
      console.log('UserProfileComponent: No province ID found for location cascade');
      return;
    }

    console.log('UserProfileComponent: Loading location cascade for edit mode');
    
    this.fetchDistrictsByProvince(this.userProfile.provinceId);
    
    // Use setTimeout to allow for async loading and proper cascade
    setTimeout(() => {
      if (this.userProfile.districtId) {
        this.fetchSectorsByDistrict(this.userProfile.districtId);
        
        setTimeout(() => {
          if (this.userProfile.sectorId) {
            this.fetchCellsBySector(this.userProfile.sectorId);
            
            setTimeout(() => {
              if (this.userProfile.cellId) {
                this.fetchVillagesByCell(this.userProfile.cellId);
              }
            }, 500);
          }
        }, 500);
      }
    }, 500);
  }

  onProvinceChange(): void {
    console.log('UserProfileComponent: Province changed to:', this.userProfile.provinceId);
    
    // Clear dependent fields
    this.userProfile.districtId = undefined;
    this.userProfile.sectorId = undefined;
    this.userProfile.cellId = undefined;
    this.userProfile.villageId = undefined;
    
    // Clear dependent dropdowns
    this.districts = [];
    this.sectors = [];
    this.cells = [];
    this.villages = [];
    
    if (this.userProfile.provinceId) {
      this.fetchDistrictsByProvince(this.userProfile.provinceId);
    }
  }

  onDistrictChange(): void {
    console.log('UserProfileComponent: District changed to:', this.userProfile.districtId);
    
    // Clear dependent fields
    this.userProfile.sectorId = undefined;
    this.userProfile.cellId = undefined;
    this.userProfile.villageId = undefined;
    
    // Clear dependent dropdowns
    this.sectors = [];
    this.cells = [];
    this.villages = [];
    
    if (this.userProfile.districtId) {
      this.fetchSectorsByDistrict(this.userProfile.districtId);
    }
  }

  onSectorChange(): void {
    console.log('UserProfileComponent: Sector changed to:', this.userProfile.sectorId);
    
    // Clear dependent fields
    this.userProfile.cellId = undefined;
    this.userProfile.villageId = undefined;
    
    // Clear dependent dropdowns
    this.cells = [];
    this.villages = [];
    
    if (this.userProfile.sectorId) {
      this.fetchCellsBySector(this.userProfile.sectorId);
    }
  }

  onCellChange(): void {
    console.log('UserProfileComponent: Cell changed to:', this.userProfile.cellId);
    
    // Clear dependent field
    this.userProfile.villageId = undefined;
    
    // Clear dependent dropdown
    this.villages = [];
    
    if (this.userProfile.cellId) {
      this.fetchVillagesByCell(this.userProfile.cellId);
    }
  }

  enableEditMode(): void {
    console.log('UserProfileComponent: Enabling edit mode');
    this.editMode = true;
    this.submitted = false;
    this.extractLocationIds();
    
    // Load location data if available
    if (this.userProfile.provinceId && this.provinces.length > 0) {
      this.loadLocationDataForEdit();
    }
  }

  cancelEdit(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to cancel? All unsaved changes will be lost.',
      header: 'Confirm Cancel',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        console.log('UserProfileComponent: Cancelling edit mode');
        this.userProfile = { ...this.originalProfile };
        this.editMode = false;
        this.submitted = false;
        this.resetLocationDropdowns();
      }
    });
  }

  saveProfile(): void {
    console.log('UserProfileComponent: Attempting to save profile');
    this.submitted = true;

    if (!this.isFormValid()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill in all required fields'
      });
      return;
    }

    // Validate phone number
    const phone = this.userProfile.telephoneNumber;
    const isValid = /^(0\d{9}|\+250\d{9})$/.test(phone);
    
    if (!isValid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Phone Number',
        detail: 'Enter a valid phone number starting with 0 or +250 followed by 9 digits.'
      });
      return;
    }

    this.saving = true;
    const updateRequest = this.buildUpdateRequest();

    console.log('UserProfileComponent: Sending update request:', updateRequest);

    const apiUrl = `${environment.API_BASE_URL}/users/${this.userProfile.id}`;
    this.http.patch<UserProfile>(apiUrl, updateRequest).subscribe({
      next: (response) => {
        console.log('UserProfileComponent: Profile updated successfully:', response);
        this.userProfile = { ...response };
        this.originalProfile = { ...response };
        this.extractLocationIds();
        
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Profile updated successfully'
        });
        
        this.editMode = false;
        this.saving = false;
        this.submitted = false;
      },
      error: (error) => {
        console.error('UserProfileComponent: Error updating profile:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.message || 'Failed to update profile'
        });
        this.saving = false;
      }
    });
  }

  private buildUpdateRequest(): UserUpdateRequest {
    const request: UserUpdateRequest = {
      firstName: this.userProfile.firstName,
      lastName: this.userProfile.lastName,
      telephoneNumber: this.userProfile.telephoneNumber,
      locations: []
    };

    // Add location if all fields are filled
    if (this.userProfile.provinceId && this.userProfile.districtId && 
        this.userProfile.sectorId && this.userProfile.cellId && this.userProfile.villageId) {
      request.locations = [{
        provinceId: parseInt(this.userProfile.provinceId),
        districtId: parseInt(this.userProfile.districtId),
        sectorId: parseInt(this.userProfile.sectorId),
        cellId: parseInt(this.userProfile.cellId),
        villageId: parseInt(this.userProfile.villageId)
      }];
    }

    console.log('UserProfileComponent: Built update request:', request);
    return request;
  }

  private resetLocationDropdowns(): void {
    console.log('UserProfileComponent: Resetting location dropdowns');
    this.districts = [];
    this.sectors = [];
    this.cells = [];
    this.villages = [];
  }

  isFormValid(): boolean {
    const isValid = !!(
      this.userProfile.firstName &&
      this.userProfile.lastName &&
      this.userProfile.telephoneNumber
    );
    
    console.log('UserProfileComponent: Form validation result:', isValid);
    return isValid;
  }

  getLocationDisplay(): string {
    if (this.userProfile.locations && this.userProfile.locations.length > 0) {
      const location = this.userProfile.locations[0];
      const parts = [];
      
      if (location.village?.name) parts.push(location.village.name);
      if (location.cell?.name) parts.push(location.cell.name);
      if (location.sector?.name) parts.push(location.sector.name);
      if (location.district?.name) parts.push(location.district.name);
      if (location.province?.name) parts.push(location.province.name);
      
      return parts.join(', ') || 'Location not specified';
    }
    
    return 'Location not specified';
  }

  getInitials(): string {
    const first = this.userProfile.firstName?.charAt(0)?.toUpperCase() || '';
    const last = this.userProfile.lastName?.charAt(0)?.toUpperCase() || '';
    return first + last;
  }

  getAccountStatusSeverity(): "success" | "warning" | "danger" {
    return this.userProfile.accountVerified ? 'success' : 'warning';
  }

  get2FAStatusSeverity(): "success" | "danger" {
    return this.userProfile.is2FAEnabled ? 'success' : 'danger';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  toggle2FA(): void {
    console.log('UserProfileComponent: Current 2FA status:', this.userProfile.is2FAEnabled);
    
    if (this.userProfile.is2FAEnabled) {
      // Currently enabled, user wants to disable
      this.twoFAAction = 'disable';
      this.show2FADialog = true;
      this.totpCode = '';
      console.log('UserProfileComponent: Opening disable dialog');
    } else {
      // Currently disabled, user wants to enable - need to setup first
      this.twoFAAction = 'enable';
      this.initiate2FASetup();
      console.log('UserProfileComponent: Starting 2FA setup process');
    }
  }

  private initiate2FASetup(): void {
    this.processing2FA = true;
    const apiUrl = `${environment.API_BASE_URL}/auth/2fa/setup`;
    
    console.log('UserProfileComponent: Initiating 2FA setup');

    this.http.post<any>(apiUrl, {}).subscribe({
      next: (response) => {
        console.log('UserProfileComponent: 2FA setup initiated successfully:', response);
        
        this.processing2FA = false;
        this.show2FADialog = true;
        this.totpCode = '';
        
        this.messageService.add({
          severity: 'info',
          summary: 'Setup Complete',
          detail: 'Please enter the verification code from your authenticator app'
        });
      },
      error: (error) => {
        console.error('UserProfileComponent: Error initiating 2FA setup:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Setup Error',
          detail: error.error?.message || 'Failed to initiate 2FA setup'
        });
        this.processing2FA = false;
      }
    });
  }

  private enable2FA(): void {
    const codeString = String(this.totpCode || '').trim();
    
    console.log('UserProfileComponent: TOTP code validation for enable:', {
      original: this.totpCode,
      string: codeString,
      length: codeString.length
    });

    if (!this.validateTotpCode(codeString)) {
      return;
    }

    this.processing2FA = true;
    const apiUrl = `${environment.API_BASE_URL}/auth/2fa/enable`;
    const requestBody = { totpCode: codeString };
    
    console.log('UserProfileComponent: Enabling 2FA with TOTP code');

    this.http.post<any>(apiUrl, requestBody).subscribe({
      next: (response) => {
        console.log('UserProfileComponent: 2FA enabled successfully:', response);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Two-factor authentication enabled successfully'
        });
        
        this.processing2FA = false;
        this.show2FADialog = false;
        this.resetTotpDialog();
        
        // Update the user profile
        this.userProfile.is2FAEnabled = true;
        this.originalProfile.is2FAEnabled = true;
      },
      error: (error) => {
        console.error('UserProfileComponent: Error enabling 2FA:', error);
        this.handleTotpError(error, 'enable');
        this.processing2FA = false;
      }
    });
  }

  private disable2FA(): void {
    const codeString = String(this.totpCode || '').trim();
    
    console.log('UserProfileComponent: TOTP code validation for disable:', {
      original: this.totpCode,
      string: codeString,
      length: codeString.length
    });

    if (!this.validateTotpCode(codeString)) {
      return;
    }

    this.processing2FA = true;
    const apiUrl = `${environment.API_BASE_URL}/auth/2fa/disable`;
    const requestBody = { totpCode: codeString };
    
    console.log('UserProfileComponent: Disabling 2FA with TOTP code');

    this.http.post<any>(apiUrl, requestBody).subscribe({
      next: (response) => {
        console.log('UserProfileComponent: 2FA disabled successfully:', response);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Two-factor authentication disabled successfully'
        });
        
        this.processing2FA = false;
        this.show2FADialog = false;
        this.resetTotpDialog();
        
        // Update the user profile
        this.userProfile.is2FAEnabled = false;
        this.originalProfile.is2FAEnabled = false;
      },
      error: (error) => {
        console.error('UserProfileComponent: Error disabling 2FA:', error);
        this.handleTotpError(error, 'disable');
        this.processing2FA = false;
      }
    });
  }

  private validateTotpCode(codeString: string): boolean {
    if (!codeString || codeString.length !== 6) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Code Length',
        detail: 'TOTP code must be exactly 6 digits'
      });
      return false;
    }

    if (!/^\d{6}$/.test(codeString)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Code Format',
        detail: 'TOTP code must contain only numbers'
      });
      return false;
    }

    return true;
  }

  private handleTotpError(error: any, action: string): void {
    let errorMessage = `Failed to ${action} 2FA`;
    
    if (error.status === 400) {
      if (error.error?.message && Array.isArray(error.error.message)) {
        errorMessage = 'Please check your TOTP code format. It must be exactly 6 digits.';
      } else {
        errorMessage = 'Invalid TOTP code. Please check your authenticator app and try again.';
      }
    } else if (error.status === 401) {
      errorMessage = 'TOTP code has expired or is invalid. Please enter a fresh code from your authenticator app.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage
    });
  }

  private resetTotpDialog(): void {
    this.totpCode = '';
  }

  cancel2FADialog(): void {
    this.show2FADialog = false;
    this.resetTotpDialog();
    this.processing2FA = false;
  }

  confirm2FAAction(): void {
    if (this.twoFAAction === 'enable') {
      this.enable2FA();
    } else {
      this.disable2FA();
    }
  }

  // Helper method to format TOTP input (unchanged)
  onTotpInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 6) {
      value = value.substring(0, 6);
    }
    this.totpCode = value;
    event.target.value = value;
    
    console.log('UserProfileComponent: TOTP input updated:', {
      value: value,
      length: value.length,
      type: typeof value
    });
  }

  // Method to check if TOTP code is valid format (unchanged)
  isTotpCodeValid(): boolean {
    const codeString = String(this.totpCode || '').trim();
    return codeString.length === 6 && /^\d{6}$/.test(codeString);
  }
}
