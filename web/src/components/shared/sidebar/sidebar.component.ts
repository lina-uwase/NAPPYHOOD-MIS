import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';

interface NavigationItem {
  label: string;
  icon: string;
  routerLink?: string;
  command?: () => void;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    ButtonModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input() isCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<boolean>();
  
  currentNavItems: NavigationItem[] = [
    { label: 'Dashboard', icon: 'pi pi-th-large', routerLink: '/app/dashboard' },
    { label: 'Users', icon: 'pi pi-users', routerLink: '/app/all-users' },
    { label: 'Facilities', icon: 'pi pi-building', routerLink: '/facilities' },
    { label: 'Roles & Permissions', icon: 'pi pi-shield', routerLink: '/app/roles' },
    { label: 'System Logs', icon: 'pi pi-cog', routerLink: '/system-logs' },
    { label: 'Reports', icon: 'pi pi-chart-bar', routerLink: '/app/reports' },
    { label: 'Settings', icon: 'pi pi-sliders-h', routerLink: '/settings' }
  ];

  profileItems: NavigationItem[] = [
    { label: 'My Profile', icon: 'pi pi-user', routerLink: '/app/profile' },
    { label: 'Logout', icon: 'pi pi-sign-out', command: () => this.logout() }
  ];

  ngOnInit() {
    // Component initialization if needed
  }

  onToggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.toggleSidebar.emit(this.isCollapsed); // Emit the new state to parent
  }

  logout() {
    console.log('Logging out...');

  }
}