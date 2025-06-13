import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, of, switchMap, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FollowService {
  constructor(private afs: AngularFirestore) {}

  async follow(currentUserId: string, targetUserId: string): Promise<void> {
    const batch = this.afs.firestore.batch();
    const now = new Date();
    // Takip edilenin followers'ına ekle
    const followerRef = this.afs.collection(`users/${targetUserId}/followers`).doc(currentUserId).ref;
    batch.set(followerRef, { followedAt: now });
    // Takip edenin following'ine ekle
    const followingRef = this.afs.collection(`users/${currentUserId}/following`).doc(targetUserId).ref;
    batch.set(followingRef, { followedAt: now });
    // Mevcut sayıları oku
    const targetUserSnap = await this.afs.collection('users').doc(targetUserId).ref.get();
    const currentUserSnap = await this.afs.collection('users').doc(currentUserId).ref.get();
    const targetFollowersCount = ((targetUserSnap.data() as any)?.followersCount || 0) + 1;
    const currentFollowingCount = ((currentUserSnap.data() as any)?.followingCount || 0) + 1;
    // Sayıları güncelle
    const targetUserRef = this.afs.collection('users').doc(targetUserId).ref;
    batch.update(targetUserRef, { followersCount: targetFollowersCount });
    const currentUserRef = this.afs.collection('users').doc(currentUserId).ref;
    batch.update(currentUserRef, { followingCount: currentFollowingCount });
    return batch.commit();
  }

  async unfollow(currentUserId: string, targetUserId: string): Promise<void> {
    const batch = this.afs.firestore.batch();
    // Takip edilenin followers'ından sil
    const followerRef = this.afs.collection(`users/${targetUserId}/followers`).doc(currentUserId).ref;
    batch.delete(followerRef);
    // Takip edenin following'inden sil
    const followingRef = this.afs.collection(`users/${currentUserId}/following`).doc(targetUserId).ref;
    batch.delete(followingRef);
    // Mevcut sayıları oku
    const targetUserSnap = await this.afs.collection('users').doc(targetUserId).ref.get();
    const currentUserSnap = await this.afs.collection('users').doc(currentUserId).ref.get();
    const targetFollowersCount = Math.max(((targetUserSnap.data() as any)?.followersCount || 1) - 1, 0);
    const currentFollowingCount = Math.max(((currentUserSnap.data() as any)?.followingCount || 1) - 1, 0);
    // Sayıları güncelle
    const targetUserRef = this.afs.collection('users').doc(targetUserId).ref;
    batch.update(targetUserRef, { followersCount: targetFollowersCount });
    const currentUserRef = this.afs.collection('users').doc(currentUserId).ref;
    batch.update(currentUserRef, { followingCount: currentFollowingCount });
    return batch.commit();
  }

  isFollowing(currentUserId: string, targetUserId: string): Observable<boolean> {
    return this.afs.doc(`users/${currentUserId}/following/${targetUserId}`).valueChanges().pipe(
      map(doc => !!doc)
    );
  }

  getUserCounts(userId: string): Observable<{followersCount: number, followingCount: number}> {
    return this.afs.doc<any>(`users/${userId}`).valueChanges().pipe(
      map(user => ({
        followersCount: user?.followersCount || 0,
        followingCount: user?.followingCount || 0
      }))
    );
  }

  // Kullanıcının takipçilerini getir
  getFollowers(userId: string): Observable<any[]> {
    return this.afs.collection(`users/${userId}/followers`).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const followerId = a.payload.doc.id;
        // Kullanıcı bilgilerini getir ve uid ekle
        return this.afs.doc(`users/${followerId}`).valueChanges().pipe(
          map(user => (user && typeof user === 'object' ? { ...user, uid: followerId } : { uid: followerId }))
        );
      })),
      // Tüm valueChanges() observable'larını birleştir
      switchMap(obsArr => obsArr.length ? combineLatest(obsArr) : of([]))
    );
  }

  // Kullanıcının takip ettiklerini getir
  getFollowing(userId: string): Observable<any[]> {
    return this.afs.collection(`users/${userId}/following`).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const followingId = a.payload.doc.id;
        // Kullanıcı bilgilerini getir ve uid ekle
        return this.afs.doc(`users/${followingId}`).valueChanges().pipe(
          map(user => (user && typeof user === 'object' ? { ...user, uid: followingId } : { uid: followingId }))
        );
      })),
      switchMap(obsArr => obsArr.length ? combineLatest(obsArr) : of([]))
    );
  }
} 