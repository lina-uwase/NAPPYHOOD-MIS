import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { FileUploadModule } from 'primeng/fileupload';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { environment } from '../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  telephoneNumber: string;
  role: {
    id: string;
    name: string;
  };
  status: 'Active' | 'Inactive' | 'Pending';
  locations?: LocationResponse[];
  provinceId?: string;
  districtId?: string;
  sectorId?: string;
  cellId?: string;
  villageId?: string;
  roleId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRequest {
  firstName: string;
  lastName: string;
  email: string;
  telephoneNumber: string;
  roleId: string;
  locations: LocationRequest[];
}

interface LocationRequest {
  provinceId: number;
  districtId: number;
  sectorId: number;
  cellId: number;
  villageId: number;
}

interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  telephoneNumber: string;
  role: {
    id: string;
    name: string;
    privileges?: string[];
  };
  status?: 'Active' | 'Inactive' | 'Pending';
  accountVerified?: boolean;
  is2FAEnabled?: boolean;
  locations?: LocationResponse[];
  createdAt: string;
  updatedAt: string;
}

interface LocationResponse {
  id: string;
  provinceId?: string;
  districtId?: string;
  sectorId?: string;
  cellId?: string;
  villageId?: string;
  provinceName?: string;
  districtName?: string;
  sectorName?: string;
  cellName?: string;
  villageName?: string;
  // Support for new API format
  province?: {
    id: number;
    code: number;
    name: string;
    createdAt?: string;
    updatedAt?: string;
  };
  district?: {
    id: number;
    code: number;
    name: string;
    provinceId: number;
    createdAt?: string;
    updatedAt?: string;
  };
  sector?: {
    id: number;
    code: number;
    name: string;
    districtId: number;
    createdAt?: string;
    updatedAt?: string;
  };
  cell?: {
    id: number;
    code: number;
    name: string;
    sectorId: number;
    createdAt?: string;
    updatedAt?: string;
  };
  village?: {
    id: number;
    code: number;
    name: string;
    cellId: number;
    createdAt?: string;
    updatedAt?: string;
  };
}

interface ApiLocationResponse {
  id: string;
  province: {
    id: number;
    code: number;
    name: string;
  };
  district: {
    id: number;
    code: number;
    name: string;
    provinceId: number;
  };
  sector: {
    id: number;
    code: number;
    name: string;
    districtId: number;
  };
  cell: {
    id: number;
    code: number;
    name: string;
    sectorId: number;
  };
  village: {
    id: number;
    code: number;
    name: string;
    cellId: number;
  };
}

interface ApiUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  telephoneNumber: string;
  role: {
    id: string;
    name: string;
    privileges?: string[];
  };
  status?: 'Active' | 'Inactive' | 'Pending';
  accountVerified?: boolean;
  is2FAEnabled?: boolean;
  provinceId?: string;
  districtId?: string;
  sectorId?: string;
  cellId?: string;
  villageId?: string;
  roleId?: string;
  locations?: LocationResponse[];
  createdAt: string;
  updatedAt: string;
}

interface SelectOption {
  label: string;
  value: string | number; 
}

interface UsersApiResponse {
  users: ApiUserResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RolesApiResponse {
  roles: {
    id: string;
    name: string;
    code: string;
    privileges: string[];
    userCount: number;
    createdAt: string;
    updatedAt: string;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    CheckboxModule,
    TooltipModule,
    FileUploadModule,
    RadioButtonModule,
    ToolbarModule,
    MultiSelectModule,
    InputNumberModule,
    InputTextModule
  ],
  providers: [
    MessageService,
    ConfirmationService
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class AllUsersComponent implements OnInit {
  // Component properties
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUsers: User[] = [];
  totalRecords = 0;
  loading = false;
  itemsPerPage = 10;
  rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 }
  ];
  searchValue = '';
  selectedFilter = '';
  filterOptions: SelectOption[] = [
    { label: 'All Users', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ];

  // Tab Navigation
  activeTab = 'all';

  // Dialog States
  userDialog = false;
  showImportDialog = false;
  isEditMode = false;
  saving = false;
  submitted = false;
  dialogTitle = 'Add User';

  // Current User for Editing
  user: User = this.createEmptyUser();

  // Dropdown Options
  statuses: SelectOption[] = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' },
    { label: 'Pending', value: 'Pending' }
  ];

  // Dynamic dropdown data from APIs
  roles: SelectOption[] = [];
  provinces: SelectOption[] = [];
  districts: SelectOption[] = [];
  sectors: SelectOption[] = [];
  cells: SelectOption[] = [];
  villages: SelectOption[] = [];

  // Loading states for dropdowns
  loadingRoles = false;
  loadingProvinces = false;
  loadingDistricts = false;
  loadingSectors = false;
  loadingCells = false;
  loadingVillages = false;

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('AllUsersComponent: Initializing component');
    console.log('AllUsersComponent: User authenticated:', this.authService.isAuthenticated());
    console.log('AllUsersComponent: Token exists:', !!this.authService.getAccessToken());
    
    this.loadUsers();
    this.fetchRoles();
    this.fetchProvinces();
  }

  private createEmptyUser(): User {
    return {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      telephoneNumber: '',
      role: { id: '', name: '' },
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  loadUsers(): void {
    this.loading = true;
    const apiUrl = `${environment.API_BASE_URL}/users`;
    
    console.log('AllUsersComponent: Loading users from:', apiUrl);
    console.log('AllUsersComponent: Token will be added by interceptor:', !!this.authService.getAccessToken());
    
    this.http.get<UsersApiResponse>(apiUrl).subscribe({
      next: (response) => {
        console.log('AllUsersComponent: Raw API response:', response);
        
        if (response && response.users && Array.isArray(response.users)) {
          this.users = this.mapApiResponseToUsers(response.users);
          this.totalRecords = response.total || response.users.length;
          this.applyFilters(); // Apply current filters after loading
          console.log('AllUsersComponent: Users mapped successfully:', this.users);
        } else {
          console.error('AllUsersComponent: Invalid response structure:', response);
          this.users = [];
          this.filteredUsers = [];
          this.totalRecords = 0;
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('AllUsersComponent: Error loading users:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.status === 401 ? 'Unauthorized - Please login again' : 'Failed to load users'
        });
        this.loading = false;
      }
    });
  }

  fetchRoles(): void {
    this.loadingRoles = true;
  
    const apiUrl = `${environment.API_BASE_URL}/roles`;
    const params = new HttpParams()
      .set('page', '1')
      .set('limit', '10');
  
    console.log('AllUsersComponent: Fetching roles from:', apiUrl);
  
    this.http.get<RolesApiResponse>(apiUrl, { params }).subscribe({
      next: (response) => {
        console.log('AllUsersComponent: Raw roles response:', response);
  
        if (response && Array.isArray(response.roles)) {
          this.roles = response.roles.map((role) => ({
            label: role.name,
            value: role.id
          }));
          this.updateFilterOptions(response.roles);
        } else {
          console.error('AllUsersComponent: Invalid roles response structure:', response);
          this.roles = [];
        }
  
        this.loadingRoles = false;
      },
      error: (error) => {
        console.error('Error fetching roles:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail:
            error.status === 401
              ? 'Unauthorized - Please login again'
              : 'Failed to load roles'
        });
        this.loadingRoles = false;
      }
    });
  }

  fetchProvinces(): void {
    this.loadingProvinces = true;
    const apiUrl = `${environment.API_BASE_URL}/provinces`;
    const params = new HttpParams().set('page', '1').set('limit', '100');
  
    this.http.get<any>(apiUrl, { params }).subscribe({
      next: (response) => {
        let provincesArray: any[] = Array.isArray(response)
          ? response
          : response?.provinces || response?.data || [];
  
        this.provinces = provincesArray.map((province: any) => ({
          label: province.name,
          value: String(province.id)
        }));
        this.loadingProvinces = false;
      },
      error: (error) => {
        console.error('Error fetching provinces:', error);
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
  
    this.http.get<any>(apiUrl, { params }).subscribe({
      next: (response) => {
        let districtsArray: any[] = Array.isArray(response)
          ? response
          : response?.districts || response?.data || [];
  
        this.districts = districtsArray.map((district: any) => ({
          label: district.name,
          value: String(district.id)
        }));
        this.loadingDistricts = false;
      },
      error: (error) => {
        console.error('Error fetching districts:', error);
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
  
    this.http.get<any>(apiUrl, { params }).subscribe({
      next: (response) => {
        let sectorsArray: any[] = Array.isArray(response)
          ? response
          : response?.sectors || response?.data || [];
  
        this.sectors = sectorsArray.map((sector: any) => ({
          label: sector.name,
          value: String(sector.id)
        }));
        this.loadingSectors = false;
      },
      error: (error) => {
        console.error('Error fetching sectors:', error);
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
  
    this.http.get<any>(apiUrl, { params }).subscribe({
      next: (response) => {
        let cellsArray: any[] = Array.isArray(response)
          ? response
          : response?.cells || response?.data || [];
  
        this.cells = cellsArray.map((cell: any) => ({
          label: cell.name,
          value: String(cell.id)
        }));
        this.loadingCells = false;
      },
      error: (error) => {
        console.error('Error fetching cells:', error);
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
  
    this.http.get<any>(apiUrl, { params }).subscribe({
      next: (response) => {
        let villagesArray: any[] = Array.isArray(response)
          ? response
          : response?.villages || response?.data || [];
  
        this.villages = villagesArray.map((village: any) => ({
          label: village.name,
          value: String(village.id)
        }));
        this.loadingVillages = false;
      },
      error: (error) => {
        console.error('Error fetching villages:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load villages'
        });
        this.loadingVillages = false;
      }
    });
  }
  
  private updateFilterOptions(roles: any[]): void {
    this.filterOptions = [
      { label: 'All Users', value: '' },
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      ...roles.map(role => ({
        label: role.name,
        value: role.id
      }))
    ];
  }

  private mapApiResponseToUsers(apiUsers: ApiUserResponse[]): User[] {
    return apiUsers.map(apiUser => {
      console.log('Mapping API user:', apiUser);
      console.log('API user location IDs:', {
        provinceId: apiUser.provinceId,
        districtId: apiUser.districtId,
        sectorId: apiUser.sectorId,
        cellId: apiUser.cellId,
        villageId: apiUser.villageId
      });
      
      const mappedUser = {
        id: apiUser.id,
        firstName: apiUser.firstName,
        lastName: apiUser.lastName,
        email: apiUser.email,
        telephoneNumber: apiUser.telephoneNumber,
        role: apiUser.role,
        status: apiUser.status || (apiUser.accountVerified ? 'Active' : 'Pending'),
        // Ensure location IDs are properly mapped as strings
        provinceId: apiUser.provinceId ? String(apiUser.provinceId) : undefined,
        districtId: apiUser.districtId ? String(apiUser.districtId) : undefined,
        sectorId: apiUser.sectorId ? String(apiUser.sectorId) : undefined,
        cellId: apiUser.cellId ? String(apiUser.cellId) : undefined,
        villageId: apiUser.villageId ? String(apiUser.villageId) : undefined,
        roleId: apiUser.roleId || apiUser.role?.id,
        locations: apiUser.locations || [],
        createdAt: new Date(apiUser.createdAt),
        updatedAt: new Date(apiUser.updatedAt)
      };
      
      console.log('Mapped user result:', mappedUser);
      return mappedUser;
    });
  }

  private mapUserToApiRequest(user: User): UserRequest {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      telephoneNumber: user.telephoneNumber,
      roleId: user.roleId || user.role.id,
      locations: [{
        provinceId: parseInt(user.provinceId || '0'),
        districtId: parseInt(user.districtId || '0'),
        sectorId: parseInt(user.sectorId || '0'),
        cellId: parseInt(user.cellId || '0'),
        villageId: parseInt(user.villageId || '0')
      }]
    };
  }

  // Enhanced Search and Filter Functions
  onSearch(event: any): void {
    const value = event.target?.value || '';
    this.searchValue = value.toLowerCase();
    this.applyFilters();
  }

  onFilterChange(): void {
    console.log('Filter changed to:', this.selectedFilter);
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.users];

    // Apply search filter
    if (this.searchValue.trim()) {
      filtered = filtered.filter(user => 
        user.firstName.toLowerCase().includes(this.searchValue) ||
        user.lastName.toLowerCase().includes(this.searchValue) ||
        user.email.toLowerCase().includes(this.searchValue) ||
        user.telephoneNumber.includes(this.searchValue) ||
        user.role.name.toLowerCase().includes(this.searchValue) ||
        this.getLocationDisplay(user).toLowerCase().includes(this.searchValue)
      );
    }

    // Apply status/role filter
    if (this.selectedFilter) {
      if (this.selectedFilter === 'active') {
        filtered = filtered.filter(user => user.status === 'Active');
      } else if (this.selectedFilter === 'inactive') {
        filtered = filtered.filter(user => user.status === 'Inactive');
      } else {
        // Filter by role ID
        filtered = filtered.filter(user => user.role.id === this.selectedFilter);
      }
    }

    this.filteredUsers = filtered;
    this.totalRecords = filtered.length;
  }

  // Clear search and filters
  clearSearch(): void {
    this.searchValue = '';
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedFilter = '';
    this.searchValue = '';
    this.applyFilters();
  }

  toggleFilters(): void {
    console.log('Toggle filters');
    // advanced filters panel toggle
  }

  onPageSizeChange(): void {
    this.loadUsers();
  }

  // Tab Management
  switchTab(tabType: string): void {
    this.activeTab = tabType;
    if (tabType === 'all') {
      this.loadUsers();
    } else if (tabType === 'inactive') {
      this.loadInactiveUsers();
    }
  }

  private loadInactiveUsers(): void {
    this.loading = true;
    const apiUrl = `${environment.API_BASE_URL}/users`;
    
    this.http.get<UsersApiResponse>(apiUrl).subscribe({
      next: (response) => {
        if (response && response.users && Array.isArray(response.users)) {
          const allUsers = this.mapApiResponseToUsers(response.users);
          this.users = allUsers.filter(user => user.status === 'Inactive');
          this.filteredUsers = [...this.users];
          this.totalRecords = this.users.length;
        } else {
          this.users = [];
          this.filteredUsers = [];
          this.totalRecords = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading inactive users:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load inactive users'
        });
        this.loading = false;
      }
    });
  }

  // User Actions
  openNew(): void {
    this.isEditMode = false;
    this.dialogTitle = 'Add User';
    this.user = this.createEmptyUser();
    this.submitted = false;
    this.userDialog = true;
    this.resetLocationDropdowns();
  }

  editUser(user: User): void {
    this.isEditMode = true;
    this.dialogTitle = 'Edit User';
    
    // Deep clone the user to avoid reference issues
    this.user = JSON.parse(JSON.stringify(user));
    
    console.log('Editing user:', this.user);
    console.log('User locations array:', this.user.locations);
    console.log('User location IDs from root:', {
      provinceId: this.user.provinceId,
      districtId: this.user.districtId,
      sectorId: this.user.sectorId,
      cellId: this.user.cellId,
      villageId: this.user.villageId
    });
    
    this.submitted = false;
    this.userDialog = true;
    
    // Load location data after a brief delay to ensure dialog is open
    setTimeout(() => {
      this.loadLocationDataForEdit();
    }, 100);
  }

  deleteUser(user: User): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const apiUrl = `${environment.API_BASE_URL}/users/${user.id}`;
        this.http.delete(apiUrl).subscribe({
          next: () => {
            this.users = this.users.filter(u => u.id !== user.id);
            this.applyFilters(); // Reapply filters after deletion
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'User deleted successfully'
            });
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete user'
            });
          }
        });
      }
    });
  }

  saveUser(): void {
    this.submitted = true;

    if (!this.user.firstName || !this.user.lastName || !this.user.email || !this.user.roleId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill in all required fields'
      });
      return;
    }

    // Validate location selection
    if (!this.user.provinceId || !this.user.districtId || !this.user.sectorId || !this.user.cellId || !this.user.villageId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please select complete location information'
      });
      return;
    }

    const phone = this.user.telephoneNumber;
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
    const userRequest = this.mapUserToApiRequest(this.user);

    if (this.isEditMode) {
      // Update existing user
      const apiUrl = `${environment.API_BASE_URL}/users/${this.user.id}`;
      this.http.patch<ApiUserResponse>(apiUrl, userRequest).subscribe({
        next: (response) => {
          const updatedUser = this.mapApiResponseToUsers([response])[0];
          const index = this.users.findIndex(u => u.id === this.user.id);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }
          this.applyFilters(); // Reapply filters after update
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User updated successfully'
          });
          this.saving = false;
          this.hideDialog();
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update user'
          });
          this.saving = false;
        }
      });
    } else {
      // Create new user
      const apiUrl = `${environment.API_BASE_URL}/users`;
      this.http.post<ApiUserResponse>(apiUrl, userRequest).subscribe({
        next: (response) => {
          const newUser = this.mapApiResponseToUsers([response])[0];
          this.users = [newUser, ...this.users];
          this.applyFilters(); // Reapply filters after creation
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User created successfully'
          });
          this.saving = false;
          this.hideDialog();
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'Failed to create user'
          });
          this.saving = false;
        }
      });
    }
  }

  hideDialog(): void {
    this.userDialog = false;
    this.user = this.createEmptyUser();
    this.submitted = false;
    this.resetLocationDropdowns();
    this.loadUsers()
  }

  deleteSelectedUsers(): void {
    if (this.selectedUsers.length === 0) return;

    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${this.selectedUsers.length} selected users?`,
      header: 'Confirm Bulk Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        const selectedIds = this.selectedUsers.map(user => user.id);
        this.processBulkDelete(selectedIds, 0);
      }
    });
  }

  private processBulkDelete(userIds: string[], index: number): void {
    if (index >= userIds.length) {
      this.loadUsers();
      this.selectedUsers = [];
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${userIds.length} users deleted successfully`
      });
      return;
    }

    const apiUrl = `${environment.API_BASE_URL}/users/${userIds[index]}`;
    this.http.delete(apiUrl).subscribe({
      next: () => {
        this.processBulkDelete(userIds, index + 1);
      },
      error: (error) => {
        console.error(`Error deleting user ${userIds[index]}:`, error);
        this.processBulkDelete(userIds, index + 1);
      }
    });
  }

  // Enhanced Location Management with better error handling
  private resetLocationDropdowns(): void {
    this.districts = [];
    this.sectors = [];
    this.cells = [];
    this.villages = [];
    this.user.districtId = undefined;
    this.user.sectorId = undefined;
    this.user.cellId = undefined;
    this.user.villageId = undefined;
  }

  private loadLocationDataForEdit(): void {
    console.log('Loading location data for edit, user:', this.user);
    console.log('User locations array:', this.user.locations);
    
    // Enhanced location ID extraction with fallback logic
    let locationIds = this.extractLocationIds();
    
    console.log('Extracted location IDs:', locationIds);

    if (this.hasValidLocationIds(locationIds)) {
      // Update user object with extracted IDs
      this.user.provinceId = locationIds.provinceId;
      this.user.districtId = locationIds.districtId;
      this.user.sectorId = locationIds.sectorId;
      this.user.cellId = locationIds.cellId;
      this.user.villageId = locationIds.villageId;

      // Load provinces first, then cascade through the rest
      this.loadProvincesAndCascade();
    } else {
      console.warn('No valid location data found for user');
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Incomplete location data for this user. Please update location information.'
      });
    }
  }

  private extractLocationIds(): any {
    // First priority: Check root level properties
    if (this.user.provinceId && this.user.districtId && this.user.sectorId && 
        this.user.cellId && this.user.villageId) {
      return {
        provinceId: String(this.user.provinceId),
        districtId: String(this.user.districtId),
        sectorId: String(this.user.sectorId),
        cellId: String(this.user.cellId),
        villageId: String(this.user.villageId)
      };
    }

    // Second priority: Check locations array with new API format
    if (this.user.locations && this.user.locations.length > 0) {
      const location = this.user.locations[0];
      console.log('Extracting from locations array:', location);
      
      // Handle new API format where location data is nested in objects
      let provinceId, districtId, sectorId, cellId, villageId;
      
      if (location.province?.id) {
        provinceId = String(location.province.id);
      } else if (location.provinceId) {
        provinceId = String(location.provinceId);
      }
      
      if (location.district?.id) {
        districtId = String(location.district.id);
      } else if (location.districtId) {
        districtId = String(location.districtId);
      }
      
      if (location.sector?.id) {
        sectorId = String(location.sector.id);
      } else if (location.sectorId) {
        sectorId = String(location.sectorId);
      }
      
      if (location.cell?.id) {
        cellId = String(location.cell.id);
      } else if (location.cellId) {
        cellId = String(location.cellId);
      }
      
      if (location.village?.id) {
        villageId = String(location.village.id);
      } else if (location.villageId) {
        villageId = String(location.villageId);
      }
      
      return {
        provinceId,
        districtId,
        sectorId,
        cellId,
        villageId
      };
    }

    // Return empty object if no location data found
    return {
      provinceId: undefined,
      districtId: undefined,
      sectorId: undefined,
      cellId: undefined,
      villageId: undefined
    };
  }

  private hasValidLocationIds(locationIds: any): boolean {
    return !!(locationIds.provinceId && locationIds.districtId && 
             locationIds.sectorId && locationIds.cellId && locationIds.villageId);
  }

  private loadProvincesAndCascade(): void {
    console.log('Starting provinces and cascade loading');
    
    // If provinces are already loaded, start cascading immediately
    if (this.provinces.length > 0) {
      console.log('Provinces already loaded, starting cascade');
      this.cascadeLocationDropdowns();
    } else {
      console.log('Loading provinces first');
      // Load provinces first, then cascade
      this.loadingProvinces = true;
      
      this.fetchProvinces();
      
      // Wait for provinces to load, then start cascading
      const checkProvincesLoaded = () => {
        if (!this.loadingProvinces && this.provinces.length > 0) {
          console.log('Provinces loaded, starting cascade');
          this.cascadeLocationDropdowns();
        } else if (!this.loadingProvinces) {
          console.error('Failed to load provinces');
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load province data'
          });
        } else {
          // Still loading, check again
          setTimeout(checkProvincesLoaded, 200);
        }
      };
      
      setTimeout(checkProvincesLoaded, 500);
    }
  }

  private cascadeLocationDropdowns(): void {
    console.log('Starting cascade with user location IDs:', {
      provinceId: this.user.provinceId,
      districtId: this.user.districtId,
      sectorId: this.user.sectorId,
      cellId: this.user.cellId,
      villageId: this.user.villageId
    });

    if (!this.user.provinceId) {
      console.warn('No provinceId found to start cascade');
      return;
    }

    console.log('Loading districts for province:', this.user.provinceId);
    this.fetchDistrictsByProvince(this.user.provinceId);
    
    // Enhanced cascade with better error handling
    this.waitForDropdownLoad('districts', () => {
      if (this.user.districtId && this.districts.length > 0) {
        console.log('Districts loaded, loading sectors for district:', this.user.districtId);
        this.fetchSectorsByDistrict(this.user.districtId);
        
        this.waitForDropdownLoad('sectors', () => {
          if (this.user.sectorId && this.sectors.length > 0) {
            console.log('Sectors loaded, loading cells for sector:', this.user.sectorId);
            this.fetchCellsBySector(this.user.sectorId);
            
            this.waitForDropdownLoad('cells', () => {
              if (this.user.cellId && this.cells.length > 0) {
                console.log('Cells loaded, loading villages for cell:', this.user.cellId);
                this.fetchVillagesByCell(this.user.cellId);
              }
            });
          }
        });
      }
    });
  }

  private waitForDropdownLoad(type: string, callback: () => void): void {
    const maxAttempts = 25; // 5 seconds max wait
    let attempts = 0;
    
    const checkLoaded = () => {
      attempts++;
      
      let isLoading = false;
      let hasData = false;
      
      switch (type) {
        case 'districts':
          isLoading = this.loadingDistricts;
          hasData = this.districts.length > 0;
          break;
        case 'sectors':
          isLoading = this.loadingSectors;
          hasData = this.sectors.length > 0;
          break;
        case 'cells':
          isLoading = this.loadingCells;
          hasData = this.cells.length > 0;
          break;
        case 'villages':
          isLoading = this.loadingVillages;
          hasData = this.villages.length > 0;
          break;
      }
      
      if (!isLoading && hasData) {
        console.log(`${type} loaded successfully`);
        callback();
      } else if (!isLoading && attempts < maxAttempts) {
        console.warn(`${type} not loaded yet, retrying...`);
        setTimeout(checkLoaded, 200);
      } else if (attempts >= maxAttempts) {
        console.error(`Timeout waiting for ${type} to load`);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to load ${type} data`
        });
      } else {
        // Still loading, check again
        setTimeout(checkLoaded, 200);
      }
    };
    
    setTimeout(checkLoaded, 500);
  }

  // Enhanced location change handlers
  onProvinceChange(): void {
    console.log('Province changed to:', this.user.provinceId);
    
    // Clear dependent fields
    this.user.districtId = undefined;
    this.user.sectorId = undefined;
    this.user.cellId = undefined;
    this.user.villageId = undefined;
    
    // Clear dependent dropdowns
    this.districts = [];
    this.sectors = [];
    this.cells = [];
    this.villages = [];
    
    if (!this.user?.provinceId) return;
    
    console.log('Fetching districts for province:', this.user.provinceId);
    this.fetchDistrictsByProvince(this.user.provinceId);
  }

  onDistrictChange(): void {
    console.log('District changed to:', this.user.districtId);
    
    // Clear dependent fields
    this.user.sectorId = undefined;
    this.user.cellId = undefined;
    this.user.villageId = undefined;
    
    // Clear dependent dropdowns
    this.sectors = [];
    this.cells = [];
    this.villages = [];
    
    if (!this.user?.districtId) return;
    
    console.log('Fetching sectors for district:', this.user.districtId);
    this.fetchSectorsByDistrict(this.user.districtId);
  }

  onSectorChange(): void {
    console.log('Sector changed to:', this.user.sectorId);
    
    // Clear dependent fields
    this.user.cellId = undefined;
    this.user.villageId = undefined;
    
    // Clear dependent dropdowns
    this.cells = [];
    this.villages = [];
    
    if (!this.user?.sectorId) return;
    
    console.log('Fetching cells for sector:', this.user.sectorId);
    this.fetchCellsBySector(this.user.sectorId);
  }

  onCellChange(): void {
    console.log('Cell changed to:', this.user.cellId);
    
    // Clear dependent field
    this.user.villageId = undefined;
    
    // Clear dependent dropdown
    this.villages = [];
    
    if (!this.user?.cellId) return;
    
    console.log('Fetching villages for cell:', this.user.cellId);
    this.fetchVillagesByCell(this.user.cellId);
  }

  // Import/Export functionality
  openImportDialog(): void {
    this.showImportDialog = true;
  }

  importUsers(event: any): void {
    const file = event.files[0];
    if (file) {
      this.messageService.add({
        severity: 'info',
        summary: 'Import Started',
        detail: `Processing ${file.name}...`
      });
      
      // TODO: Implement CSV parsing and bulk API calls
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Import Complete',
          detail: 'Users imported successfully'
        });
        this.loadUsers();
        this.showImportDialog = false;
      }, 2000);
    }
  }

  exportCSV(): void {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Export Complete',
      detail: 'Users exported to CSV successfully'
    });
  }

  private generateCSV(): string {
    const headers = [
      'First Name', 
      'Last Name', 
      'Email', 
      'Phone', 
      'Role', 
      'Status', 
      'Location',
      'Created At'
    ];
    const csvRows = [headers.join(',')];
    
    // Use filtered users for export
    this.filteredUsers.forEach(user => {
      const row = [
        user.firstName,
        user.lastName,
        user.email,
        user.telephoneNumber,
        user.role?.name || '',
        user.status,
        this.getLocationDisplay(user),
        user.createdAt.toISOString().split('T')[0]
      ];
      csvRows.push(row.map(field => `"${field}"`).join(','));
    });
    
    return csvRows.join('\n');
  }

  // Utility Methods
  getLocationDisplay(user: User): string {
    if (user.locations && user.locations.length > 0) {
      const location = user.locations[0];
      const parts = [];
      
      // Handle both old and new API response formats
      if (location.village?.name) parts.push(location.village.name);
      else if (location.villageName) parts.push(location.villageName);
      
      if (location.cell?.name) parts.push(location.cell.name);
      else if (location.cellName) parts.push(location.cellName);
      
      if (location.sector?.name) parts.push(location.sector.name);
      else if (location.sectorName) parts.push(location.sectorName);
      
      if (location.district?.name) parts.push(location.district.name);
      else if (location.districtName) parts.push(location.districtName);
      
      if (location.province?.name) parts.push(location.province.name);
      else if (location.provinceName) parts.push(location.provinceName);
      
      return parts.join(', ') || 'Location not specified';
    }
    
    return 'Location not specified';
  }

  getStatusSeverity(status: string): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Inactive':
        return 'danger';
      case 'Pending':
        return 'warning';
      default:
        return 'info';
    }
  }

  isFormValid(): boolean {
    return !!(
      this.user.firstName &&
      this.user.lastName &&
      this.user.email &&
      this.user.telephoneNumber &&
      this.user.roleId &&
      this.user.provinceId &&
      this.user.districtId &&
      this.user.sectorId &&
      this.user.cellId &&
      this.user.villageId
    );
  }

  // Enhanced filtering methods for better performance
  getFilteredUsersCount(): number {
    return this.filteredUsers.length;
  }

  getTotalUsersCount(): number {
    return this.users.length;
  }

  getActiveFilterLabel(): string {
    if (!this.selectedFilter) return 'All Users';
    
    const filter = this.filterOptions.find(option => option.value === this.selectedFilter);
    return filter ? filter.label : 'Unknown Filter';
  }

  hasActiveFilters(): boolean {
    return !!(this.searchValue.trim() || this.selectedFilter);
  }

  // Debug method to help troubleshoot location issues
  debugUserLocation(user: User): void {
    console.log('=== USER LOCATION DEBUG ===');
    console.log('Full user object:', user);
    console.log('Root level location IDs:', {
      provinceId: user.provinceId,
      districtId: user.districtId,
      sectorId: user.sectorId,
      cellId: user.cellId,
      villageId: user.villageId
    });
    console.log('Locations array:', user.locations);
    if (user.locations && user.locations.length > 0) {
      console.log('First location object:', user.locations[0]);
      const location = user.locations[0];
      console.log('Location structure analysis:');
      console.log('- Province:', {
        nested: location.province,
        direct: { id: location.provinceId, name: location.provinceName }
      });
      console.log('- District:', {
        nested: location.district,
        direct: { id: location.districtId, name: location.districtName }
      });
      console.log('- Sector:', {
        nested: location.sector,
        direct: { id: location.sectorId, name: location.sectorName }
      });
      console.log('- Cell:', {
        nested: location.cell,
        direct: { id: location.cellId, name: location.cellName }
      });
      console.log('- Village:', {
        nested: location.village,
        direct: { id: location.villageId, name: location.villageName }
      });
    }
    console.log('Location display result:', this.getLocationDisplay(user));
    console.log('=== END DEBUG ===');
  }

  // Method to test location display in template (call via button click)
  testLocationDisplay(user: User): void {
    this.debugUserLocation(user);
  }

  // String utility for row numbers
  String = String;
}