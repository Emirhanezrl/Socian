import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ImageUploadService } from '../../services/image-upload.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Timestamp } from 'firebase/firestore';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { FollowService } from '../../services/follow.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  postContent: string = '';
  selectedImage: File | null = null;
  selectedImageUrl: string | null = null;
  isUploading: boolean = false;
  isPostUploading: boolean = false;
  posts: any[] = [];
  currentUser: any = null;
  uid: string = '';
  successMessage: string = '';
  currentUserId: string = '';
  followingIds: string[] = [];

  constructor(
    private authService: AuthService,
    private imageUploadService: ImageUploadService,
    private afs: AngularFirestore,
    private router: Router,
    private followService: FollowService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.uid = user.uid;
        this.currentUserId = user.uid;
        this.authService.getUserData(user.uid).subscribe(data => {
          this.currentUser = data;
        });
        // Takip edilenleri çek
        this.afs.collection(`users/${user.uid}/following`).snapshotChanges().subscribe(snaps => {
          this.followingIds = snaps.map(snap => snap.payload.doc.id);
          // Kendi id'ni de ekle (kendi gönderilerin de gözüksün)
          if (!this.followingIds.includes(user.uid)) {
            this.followingIds.push(user.uid);
          }
          this.loadPosts();
        });
      }
    });
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedImage = null;
    this.selectedImageUrl = null;
  }

  async sharePost() {
    if (!this.postContent && !this.selectedImage) return;
    this.isUploading = true;
    this.isPostUploading = true;
    let imageUrl = '';
    if (this.selectedImage) {
      imageUrl = await this.imageUploadService.uploadImage(
        this.selectedImage,
        `post_images/${Date.now()}_${this.selectedImage.name}`
      ).toPromise() || '';
    }
    const postData = {
      uid: this.uid,
      firstName: this.currentUser?.firstName,
      lastName: this.currentUser?.lastName,
      username: this.currentUser?.username,
      profilePhotoUrl: this.currentUser?.profilePhotoUrl,
      content: this.postContent,
      imageUrl: imageUrl,
      createdAt: new Date()
    };
    await this.afs.collection('posts').add(postData);
    this.postContent = '';
    this.removeImage();
    this.isUploading = false;
    this.isPostUploading = false;
    this.loadPosts();
    this.successMessage = 'Gönderi başarıyla paylaşıldı!';
    setTimeout(() => { this.successMessage = ''; }, 2000);
  }

  loadPosts() {
    this.afs.collection('posts', ref => ref.orderBy('createdAt', 'desc')).snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as any;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    ).subscribe(posts => {
      // Sadece takip edilenlerin ve kendi gönderilerini filtrele
      this.posts = posts.filter(post => this.followingIds.includes(post.uid));
      this.posts.forEach(post => {
        // Beğeni sayısı
        this.afs.collection('posts').doc(post.id).collection('likes').get().subscribe(snap => {
          post.likeCount = snap.size;
        });
        // Retweet sayısı
        this.afs.collection('posts').doc(post.id).collection('retweets').get().subscribe(snap => {
          post.retweetCount = snap.size;
        });
        // Yorum sayısı
        this.afs.collection('posts').doc(post.id).collection('comments').get().subscribe(snap => {
          post.commentCount = snap.size;
        });
        // Kullanıcı beğenmiş mi
        if (this.currentUserId) {
          this.afs.collection('posts').doc(post.id).collection('likes').doc(this.currentUserId).valueChanges().subscribe(like => {
            post.isLiked = !!like;
          });
          // Kullanıcı retweetlemiş mi
          this.afs.collection('posts').doc(post.id).collection('retweets').doc(this.currentUserId).valueChanges().subscribe(retweet => {
            post.isRetweeted = !!retweet;
          });
        }
      });
    });
  }

  navigateToPost(post: any) {
    if (post && post.id) {
      this.router.navigate(['/post', post.id]);
    }
  }

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
}
