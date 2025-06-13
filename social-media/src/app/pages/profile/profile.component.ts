import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { FollowService } from '../../services/follow.service';
import { ImageUploadService } from '../../services/image-upload.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  userData: any = null;
  private userSub: Subscription | undefined;
  isOwnProfile: boolean = true;
  posts: any[] = [];
  followersCount: number = 0;
  followingCount: number = 0;
  isFollowing: boolean = false;
  currentUserId: string | null = null;
  followSub: Subscription | undefined;

  // Takipçi/Takip modalı için
  showFollowModal: boolean = false;
  followModalType: 'followers' | 'following' = 'followers';
  followersList: any[] = [];
  followingList: any[] = [];

  // Profili Düzenle Modalı için
  showEditProfileModal: boolean = false;
  editProfile: any = {
    coverPhotoPreview: '',
    profilePhotoPreview: '',
    firstName: '',
    lastName: '',
    username: ''
  };
  isProfileChanged: boolean = false;
  private originalProfile: any = {};

  allPosts: any[] = [];

  isSaving: boolean = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private followService: FollowService,
    private imageUploadService: ImageUploadService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user?.uid || null;
    });
    this.route.paramMap.subscribe(params => {
      const username = params.get('username');
      if (username) {
        this.authService.currentUser$.subscribe(user => {
          if (user) {
            this.authService.getUserData(user.uid).subscribe(currentUserData => {
              if (currentUserData && currentUserData.username === username) {
                this.isOwnProfile = true;
              } else {
        this.isOwnProfile = false;
              }
            });
          }
        });
        this.authService.afs.collection('users', ref => ref.where('username', '==', username))
          .snapshotChanges()
          .subscribe(users => {
            if (users.length > 0) {
              const userDoc = users[0];
              this.userData = {
                uid: userDoc.payload.doc.id,
                ...(userDoc.payload.doc.data() as any)
              };
              this.loadFollowCounts(this.userData.uid);
              this.checkFollowing(this.userData.uid);
              if (this.userData?.username) {
                this.loadAllPostsForProfile(this.userData.uid, this.userData.username);
              }
            }
          });
      } else {
        this.isOwnProfile = true;
        this.authService.currentUser$.subscribe(user => {
          if (user) {
            this.userSub = this.authService.getUserData(user.uid).subscribe(data => {
              this.userData = { uid: user.uid, ...data };
              if (this.userData?.uid) {
                this.loadFollowCounts(this.userData.uid);
                this.loadAllPostsForProfile(this.userData.uid, this.userData.username);
              }
            });
          }
        });
      }
    });

    // Kullanıcı verisi yüklendiğinde editProfile'a kopyala
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.authService.getUserData(user.uid).subscribe(data => {
          if (data) {
            this.editProfile = {
              coverPhotoPreview: '',
              profilePhotoPreview: '',
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              username: data.username || ''
            };
            this.originalProfile = { ...this.editProfile };
            this.isProfileChanged = false;
          }
        });
      }
    });
  }

  loadAllPostsForProfile(uid: string, username: string) {
    // Kendi gönderileri
    this.authService.afs.collection('posts', ref => ref.where('uid', '==', uid)).snapshotChanges().subscribe(ownSnaps => {
      const ownPosts = ownSnaps.map(snap => {
        const data = snap.payload.doc.data() as any;
        return {
          ...data,
          id: snap.payload.doc.id,
          type: 'own',
          time: data.createdAt?.seconds ? new Date(data.createdAt.seconds * 1000) : new Date(data.createdAt)
        };
      });
      // Retweetledikleri
      this.authService.afs.collection('posts').snapshotChanges().subscribe(allSnaps => {
        const retweetPosts: any[] = [];
        let pending = allSnaps.length;
        if (pending === 0) {
          this.mergeAndSortPosts(ownPosts, retweetPosts);
        }
        allSnaps.forEach(snap => {
          const postId = snap.payload.doc.id;
          const data = snap.payload.doc.data() as any;
          this.authService.afs.collection('posts').doc(postId).collection('retweets').doc(uid).get().subscribe(retweetDoc => {
            if (retweetDoc.exists) {
              const retweetData = retweetDoc.data() as any;
              retweetPosts.push({
                ...data,
                id: postId,
                type: 'retweet',
                retweetBy: username,
                time: retweetData.retweetedAt?.seconds ? new Date(retweetData.retweetedAt.seconds * 1000) : new Date(retweetData.retweetedAt)
              });
            }
            pending--;
            if (pending === 0) {
              this.mergeAndSortPosts(ownPosts, retweetPosts);
            }
          });
        });
      });
    });
  }

  mergeAndSortPosts(ownPosts: any[], retweetPosts: any[]) {
    this.allPosts = [...ownPosts, ...retweetPosts].sort((a, b) => b.time.getTime() - a.time.getTime());
    this.loadPostInteractions(this.allPosts);
  }

  loadPostsByUsername(username: string) {
    this.authService.afs.collection('posts', ref => ref.where('username', '==', username).orderBy('createdAt', 'desc')).valueChanges().subscribe(posts => {
      this.posts = posts;
    });
  }

  loadFollowCounts(userId: string) {
    this.followService.getUserCounts(userId).subscribe(counts => {
      this.followersCount = counts.followersCount;
      this.followingCount = counts.followingCount;
    });
  }

  checkFollowing(targetUserId: string) {
    if (!this.currentUserId) return;
    this.followSub = this.followService.isFollowing(this.currentUserId, targetUserId).subscribe(isFollow => {
      this.isFollowing = isFollow;
    });
  }

  onFollowClick() {
    if (!this.currentUserId || !this.userData?.uid) return;
    if (this.isFollowing) {
      this.followService.unfollow(this.currentUserId, this.userData.uid);
    } else {
      this.followService.follow(this.currentUserId, this.userData.uid);
    }
  }

  // Takipçi/Takip modalını aç
  openFollowModal(type: 'followers' | 'following') {
    this.followModalType = type;
    this.showFollowModal = true;
    if (type === 'followers') {
      this.loadFollowersList();
    } else {
      this.loadFollowingList();
    }
  }

  // Modalı kapat
  closeFollowModal() {
    this.showFollowModal = false;
  }

  // Takipçi listesini çek
  loadFollowersList() {
    if (!this.userData?.uid) return;
    this.followService.getFollowers(this.userData.uid).subscribe((users: any[]) => {
      this.followersList = users;
    });
  }

  // Takip edilenler listesini çek
  loadFollowingList() {
    if (!this.userData?.uid) return;
    this.followService.getFollowing(this.userData.uid).subscribe((users: any[]) => {
      this.followingList = users;
    });
  }

  // Takibi bırak fonksiyonu
  unfollowUser(user: any) {
    if (!this.currentUserId || !user?.uid) return;
    this.followService.unfollow(this.currentUserId, user.uid).then(() => {
      this.loadFollowingList();
      this.loadFollowCounts(this.userData.uid);
    });
  }

  openEditProfileModal() {
    this.showEditProfileModal = true;
    // Modal açıldığında mevcut verileri tekrar yükle
    if (this.userData) {
      this.editProfile = {
        coverPhotoPreview: '',
        profilePhotoPreview: '',
        firstName: this.userData.firstName || '',
        lastName: this.userData.lastName || '',
        username: this.userData.username || ''
      };
      this.originalProfile = { ...this.editProfile };
      this.isProfileChanged = false;
    }
  }

  closeEditProfileModal() {
    this.showEditProfileModal = false;
  }

  onCoverPhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editProfile.coverPhotoPreview = e.target.result;
        this.checkProfileChanged();
      };
      reader.readAsDataURL(file);
      this.editProfile.coverPhotoFile = file;
    }
  }

  onProfilePhotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editProfile.profilePhotoPreview = e.target.result;
        this.checkProfileChanged();
      };
      reader.readAsDataURL(file);
      this.editProfile.profilePhotoFile = file;
    }
  }

  checkProfileChanged() {
    // Sadece değişiklik varsa buton aktif olsun
    this.isProfileChanged =
      this.editProfile.firstName !== this.originalProfile.firstName ||
      this.editProfile.lastName !== this.originalProfile.lastName ||
      this.editProfile.username !== this.originalProfile.username ||
      !!this.editProfile.coverPhotoFile ||
      !!this.editProfile.profilePhotoFile;
  }

  async onSaveProfile() {
    if (!this.userData?.uid) return;
    this.isSaving = true;
    const uid = this.userData.uid;
    let coverPhotoUrl = this.userData.coverPhotoUrl || '';
    let profilePhotoUrl = this.userData.profilePhotoUrl || '';

    // Kapak fotoğrafı değiştiyse yükle
    if (this.editProfile.coverPhotoFile) {
      try {
        coverPhotoUrl = await this.imageUploadService.uploadImage(this.editProfile.coverPhotoFile, `users/${uid}/cover`).toPromise() || coverPhotoUrl;
      } catch (e) { }
    }
    // Profil fotoğrafı değiştiyse yükle
    if (this.editProfile.profilePhotoFile) {
      try {
        profilePhotoUrl = await this.imageUploadService.uploadImage(this.editProfile.profilePhotoFile, `users/${uid}/profile`).toPromise() || profilePhotoUrl;
      } catch (e) { }
    }

    // Sadece değişen alanları güncelle
    const updateData: any = {};
    if (this.editProfile.firstName !== this.originalProfile.firstName) updateData.firstName = this.editProfile.firstName;
    if (this.editProfile.lastName !== this.originalProfile.lastName) updateData.lastName = this.editProfile.lastName;
    if (this.editProfile.username !== this.originalProfile.username) updateData.username = this.editProfile.username;
    if (coverPhotoUrl !== this.userData.coverPhotoUrl) updateData.coverPhotoUrl = coverPhotoUrl;
    if (profilePhotoUrl !== this.userData.profilePhotoUrl) updateData.profilePhotoUrl = profilePhotoUrl;

    if (Object.keys(updateData).length > 0) {
      await this.authService.afs.collection('users').doc(uid).set(updateData, { merge: true });
    }

    this.isSaving = false;
    this.closeEditProfileModal();
  }

  // Home'daki gibi post etkileşimlerini yükle
  loadPostInteractions(posts: any[]) {
    posts.forEach(post => {
      // Beğeni sayısı
      this.authService.afs.collection('posts').doc(post.id).collection('likes').get().subscribe(snap => {
        post.likeCount = snap.size;
      });
      // Retweet sayısı
      this.authService.afs.collection('posts').doc(post.id).collection('retweets').get().subscribe(snap => {
        post.retweetCount = snap.size;
      });
      // Yorum sayısı
      this.authService.afs.collection('posts').doc(post.id).collection('comments').get().subscribe(snap => {
        post.commentCount = snap.size;
      });
      // Kullanıcı beğenmiş mi
      if (this.currentUserId) {
        this.authService.afs.collection('posts').doc(post.id).collection('likes').doc(this.currentUserId).valueChanges().subscribe(like => {
          post.isLiked = !!like;
        });
        // Kullanıcı retweetlemiş mi
        this.authService.afs.collection('posts').doc(post.id).collection('retweets').doc(this.currentUserId).valueChanges().subscribe(retweet => {
          post.isRetweeted = !!retweet;
        });
      }
    });
  }

  // Home'daki gibi post detayına git
  navigateToPost(post: any) {
    if (post && post.id) {
      this.router.navigate(['/post', post.id]);
    }
  }

  // Home'daki gibi beğeni
  toggleLike(post: any) {
    if (!this.currentUserId || !post.id) return;
    if (post.isLiked) {
      this.authService.unlikePost(post.id, this.currentUserId).then(() => {
        post.isLiked = false;
        post.likeCount = Math.max(0, (post.likeCount || 1) - 1);
      });
    } else {
      this.authService.likePost(post.id, this.currentUserId).then(() => {
        post.isLiked = true;
        post.likeCount = (post.likeCount || 0) + 1;
      });
    }
  }

  // Home'daki gibi retweet
  toggleRetweet(post: any) {
    if (!this.currentUserId || !post.id) return;
    if (post.isRetweeted) {
      this.authService.unretweetPost(post.id, this.currentUserId).then(() => {
        post.isRetweeted = false;
        post.retweetCount = Math.max(0, (post.retweetCount || 1) - 1);
      });
    } else {
      this.authService.retweetPost(post.id, this.currentUserId).then(() => {
        post.isRetweeted = true;
        post.retweetCount = (post.retweetCount || 0) + 1;
      });
    }
  }

  // Yorumlara git (detay sayfası)
  goToPostComments(post: any) {
    this.navigateToPost(post);
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.followSub?.unsubscribe();
  }
}
