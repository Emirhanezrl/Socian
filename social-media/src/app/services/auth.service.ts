import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
// import firebase from 'firebase/compat/app';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  currentUser$: Observable<any>;

  constructor(private afAuth: AngularFireAuth, public afs: AngularFirestore) {
    this.currentUser$ = afAuth.authState;
  }

  register(email: string, password: string): Promise<any> {
    return this.afAuth.createUserWithEmailAndPassword(email, password);
  }

  login(email: string, password: string): Promise<any> {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  logout(): Promise<void> {
    return this.afAuth.signOut();
  }

  getCurrentUser(): Observable<any> {
    return this.currentUser$;
  }

  saveUserData(uid: string, coverPhotoUrl: string, profilePhotoUrl: string, biography: string, username: string, firstName: string, lastName: string): Promise<void> {
    return this.afs.collection('users').doc(uid).set({
      coverPhotoUrl,
      profilePhotoUrl,
      biography,
      username,
      firstName,
      lastName,
      followersCount: 0,
      followingCount: 0
    }, { merge: true });
  }

  getUserData(uid: string): Observable<any> {
    return this.afs.collection('users').doc(uid).valueChanges();
  }

  searchUsersByUsername(term: string): Observable<any[]> {
    return this.afs.collection('users', ref => ref
      .orderBy('username')
      .startAt(term)
      .endAt(term + '\uf8ff')
    ).valueChanges();
  }

  // --- Beğeni işlemleri ---
  likePost(postId: string, userId: string) {
    return this.afs.collection('posts').doc(postId).collection('likes').doc(userId).set({ likedAt: new Date() });
  }

  unlikePost(postId: string, userId: string) {
    return this.afs.collection('posts').doc(postId).collection('likes').doc(userId).delete();
  }

  isPostLiked(postId: string, userId: string) {
    return this.afs.collection('posts').doc(postId).collection('likes').doc(userId).valueChanges();
  }

  getPostLikeCount(postId: string) {
    return this.afs.collection('posts').doc(postId).collection('likes').get();
  }

  // --- Retweet işlemleri ---
  retweetPost(postId: string, userId: string) {
    return this.afs.collection('posts').doc(postId).collection('retweets').doc(userId).set({ retweetedAt: new Date() });
  }

  unretweetPost(postId: string, userId: string) {
    return this.afs.collection('posts').doc(postId).collection('retweets').doc(userId).delete();
  }

  isPostRetweeted(postId: string, userId: string) {
    return this.afs.collection('posts').doc(postId).collection('retweets').doc(userId).valueChanges();
  }

  getPostRetweetCount(postId: string) {
    return this.afs.collection('posts').doc(postId).collection('retweets').get();
  }

  // --- Yorum işlemleri ---
  addCommentToPost(postId: string, comment: any) {
    return this.afs.collection('posts').doc(postId).collection('comments').add(comment);
  }

  getCommentsForPost(postId: string) {
    return this.afs.collection('posts').doc(postId).collection('comments', ref => ref.orderBy('createdAt', 'asc')).snapshotChanges();
  }

  // Tüm postları çek (en yeni en üstte)
  getAllPosts(): Observable<any[]> {
    return this.afs.collection('posts', ref => ref.orderBy('createdAt', 'desc')).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
  }
}
