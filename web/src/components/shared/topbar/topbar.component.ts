import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    AvatarModule,
    TooltipModule
  ],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit {
  @Input() isSidebarCollapsed = false;

  currentUser?: {
    name: string;
    role: string;
    avatar?: string;
  };

  notificationCount = 0;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.currentUser = {
        name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Guest',
        role: user.role?.name ?? 'User',
        avatar: '/assets/default-avatar.png'
      };
    }

    this.loadNotifications();
  }

  toggleUserMenu(): void {
    this.router.navigate(['/profile']);
  }

  onNotificationClick(): void {
    this.router.navigate(['/notifications']);
  }

  private loadNotifications(): void {
    // Replace with actual notification fetch logic
    this.notificationCount = 3;
  }
}
