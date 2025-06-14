import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = [];
  currentUserId: string = '';
  loading: boolean = true;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.uid;
        this.notificationService.getNotifications(this.currentUserId).subscribe(notifs => {
          this.notifications = notifs;
          this.loading = false;
        });
      }
    });
  }

  async deleteNotification(notifId: string) {
    if (!this.currentUserId) return;
    await this.notificationService.deleteNotification(this.currentUserId, notifId);
    // Silme sonrası bildirimler otomatik güncellenecek çünkü observable
  }

  onNotificationClick(notif: any) {
    if (notif.type === 'message' && notif.fromUserId) {
      this.router.navigate(['/messages'], { queryParams: { user: notif.fromUserId } });
    }
    // Diğer bildirim tipleri için ek yönlendirme eklenebilir
  }
}
