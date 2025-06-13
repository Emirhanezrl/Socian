import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  isLoggedIn: boolean = false;
  hasUnreadNotification: boolean = false;

  constructor(private authService: AuthService, private router: Router, private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (user) {
        this.notificationService.getNotifications(user.uid).subscribe(notifs => {
          this.hasUnreadNotification = notifs.some(n => !n.read);
        });
      } else {
        this.hasUnreadNotification = false;
      }
    });
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigate(['/']);
    });
  }
}
