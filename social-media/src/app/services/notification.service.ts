import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private afs: AngularFirestore) {}

  // Bildirim ekle
  async addNotification(userId: string, notification: any): Promise<void> {
    await this.afs.collection(`users/${userId}/notifications`).add(notification);
  }

  // Bildirimleri çek (yeniye göre sıralı)
  getNotifications(userId: string): Observable<any[]> {
    return this.afs.collection(`users/${userId}/notifications`, ref => ref.orderBy('createdAt', 'desc'))
      .snapshotChanges().pipe(
        map(snaps => snaps.map(snap => {
          const data = snap.payload.doc.data() as any;
          return { id: snap.payload.doc.id, ...data };
        }))
      );
  }

  // Bildirimi okundu olarak işaretle
  markAsRead(userId: string, notificationId: string): Promise<void> {
    return this.afs.collection(`users/${userId}/notifications`).doc(notificationId).update({ read: true });
  }

  // Bildirimi sil
  deleteNotification(userId: string, notificationId: string): Promise<void> {
    return this.afs.collection(`users/${userId}/notifications`).doc(notificationId).delete();
  }
} 