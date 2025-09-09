import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MessageService, ConfirmationService } from 'primeng/api';
import { environment } from '../../environments/environment';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

interface Role {
  id: string;
  name: string;
  code: string;
  privileges: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-role-management',
  templateUrl: './roles.component.html',
  providers: [MessageService, ConfirmationService],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
    DialogModule,
    InputTextModule,
    MultiSelectModule,
    ConfirmDialogModule
  ]
})
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  loadingRoles = false;
  showAddRoleDialog = false;
  showEditRoleDialog = false;
  showDetailsDialog = false;
  selectedRole: Role | null = null;

  allPrivileges: { label: string; value: string }[] = [];

  newRole = {
    name: '',
    code: '',
    privileges: [] as any[]
  };

  privilegesInput = '';

  constructor(private http: HttpClient, private messageService: MessageService, private confirmationService: ConfirmationService) {}

  ngOnInit() {
    this.fetchRoles();
    this.fetchPrivileges();
  }

  fetchRoles(): void {
    this.loadingRoles = true;
    const apiUrl = `${environment.API_BASE_URL}/roles`;
    const params = new HttpParams().set('page', '1').set('limit', '10');

    this.http.get<any>(apiUrl, { params }).subscribe({
      next: (response) => {
        this.roles = Array.isArray(response.roles) ? response.roles : [];
        this.loadingRoles = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.status === 401 ? 'Unauthorized - Please login again' : 'Failed to load roles'
        });
        this.loadingRoles = false;
      }
    });
  }

  fetchPrivileges(): void {
    const apiUrl = `${environment.API_BASE_URL}/roles/privileges`;
    this.http.get<string[]>(apiUrl).subscribe({
      next: (privs) => {
        this.allPrivileges = privs.map(p => ({
          label: p.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          value: p
        }));
      },
      error: (error) => {
        console.error('Failed to load privileges:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Could not load privileges' });
      }
    });
  }

  addRole(): void {
    if (!this.newRole.name || !this.newRole.code || !this.newRole.privileges?.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'All fields are required'
      });
      return;
    }

    const payload = {
      name: this.newRole.name,
      code: this.newRole.code,
      privileges: this.newRole.privileges.map((p: any) => p.value)
    };

    this.http.post(`${environment.API_BASE_URL}/roles`, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Role Added',
          detail: 'New role created successfully.'
        });
        this.showAddRoleDialog = false;
        this.fetchRoles();
        this.resetNewRole();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Failed',
          detail: err.error?.message || 'Failed to add role'
        });
      }
    });
  }

  editRole(role: Role): void {
    this.selectedRole = role;
    this.newRole = {
      name: role.name,
      code: role.code,
      privileges: role.privileges.map(p => ({
        label: p.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        value: p
      }))
    };
    this.showDetailsDialog = false;
    this.showEditRoleDialog = true;
  }

  updateRole(): void {
    if (!this.selectedRole) return;

    if (!this.newRole.name || !this.newRole.code || !this.newRole.privileges?.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'All fields are required'
      });
      return;
    }

    const payload = {
      name: this.newRole.name,
      code: this.newRole.code,
      privileges: this.newRole.privileges.map((p: any) => p.value)
    };

    this.http.patch(`${environment.API_BASE_URL}/roles/${this.selectedRole.id}`, payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Role "${this.newRole.name}" updated successfully`
        });
        this.showEditRoleDialog = false;
        this.fetchRoles();
        this.resetNewRole();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Update Failed',
          detail: err.error?.message || 'Failed to update role'
        });
      }
    });
  }

  deleteRole(role: Role): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      accept: () => {
        this.http.delete(`${environment.API_BASE_URL}/roles/${role.id}`).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `Role "${role.name}" deleted successfully`
            });
            this.showDetailsDialog = false;
            this.fetchRoles();
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Delete Failed',
              detail: err.error?.message || 'Could not delete role'
            });
          }
        });
      }
    });
  }

  resetNewRole(): void {
    this.newRole = { name: '', code: '', privileges: [] };
    this.privilegesInput = '';
    this.selectedRole = null;
  }
}