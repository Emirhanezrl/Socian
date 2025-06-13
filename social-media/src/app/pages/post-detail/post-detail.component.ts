import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css']
})
export class PostDetailComponent implements OnInit, OnDestroy {
  post: any = null;
  postId: string = '';
  likeCount: number = 0;
  isLiked: boolean = false;
  currentUserId: string = '';
  retweetCount: number = 0;
  isRetweeted: boolean = false;
  private likeSub: Subscription | undefined;
  private retweetSub: Subscription | undefined;
  comments: any[] = [];
  newComment: string = '';
  isCommenting: boolean = false;
  commentCount: number = 0;

  constructor(private route: ActivatedRoute, private afs: AngularFirestore, private authService: AuthService, private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.postId = id;
        this.afs.collection('posts').doc(id).valueChanges().subscribe(post => {
          this.post = post;
        });
        // Beğeni sayısı
        this.authService.getPostLikeCount(id).subscribe(snapshot => {
          this.likeCount = snapshot.size;
        });
        // Retweet sayısı
        this.authService.getPostRetweetCount(id).subscribe(snapshot => {
          this.retweetCount = snapshot.size;
        });
        // Yorumları çek
        this.authService.getCommentsForPost(id).subscribe(snaps => {
          this.comments = snaps.map(snap => {
            const data = snap.payload.doc.data() as any;
            return { id: snap.payload.doc.id, ...data };
          });
          this.commentCount = snaps.length;
        });
      }
    });
    // Kullanıcı id'sini al
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUserId = user.uid;
        if (this.postId) {
          this.checkIsLiked();
          this.checkIsRetweeted();
        }
      }
    });
  }

  checkIsLiked() {
    if (!this.postId || !this.currentUserId) return;
    this.likeSub?.unsubscribe();
    this.likeSub = this.authService.isPostLiked(this.postId, this.currentUserId).subscribe(like => {
      this.isLiked = !!like;
    });
  }

  toggleLike() {
    if (!this.postId || !this.currentUserId) return;
    if (this.isLiked) {
      this.authService.unlikePost(this.postId, this.currentUserId).then(() => {
        this.isLiked = false;
        this.likeCount = Math.max(0, this.likeCount - 1);
      });
    } else {
      this.authService.likePost(this.postId, this.currentUserId).then(() => {
        this.isLiked = true;
        this.likeCount++;
      });
    }
  }

  checkIsRetweeted() {
    if (!this.postId || !this.currentUserId) return;
    this.retweetSub?.unsubscribe();
    this.retweetSub = this.authService.isPostRetweeted(this.postId, this.currentUserId).subscribe(retweet => {
      this.isRetweeted = !!retweet;
    });
  }

  toggleRetweet() {
    if (!this.postId || !this.currentUserId) return;
    if (this.isRetweeted) {
      this.authService.unretweetPost(this.postId, this.currentUserId).then(() => {
        this.isRetweeted = false;
        this.retweetCount = Math.max(0, this.retweetCount - 1);
      });
    } else {
      this.authService.retweetPost(this.postId, this.currentUserId).then(() => {
        this.isRetweeted = true;
        this.retweetCount++;
      });
    }
  }

  async addComment() {
    if (!this.newComment.trim() || !this.currentUserId || !this.postId) return;
    this.isCommenting = true;
    // Kullanıcı bilgilerini post objesinden veya authService'den al
    const user = this.post && this.post.uid === this.currentUserId ? this.post : null;
    let userData = user;
    if (!userData) {
      userData = await firstValueFrom(this.authService.getUserData(this.currentUserId));
    }
    const comment = {
      userId: this.currentUserId,
      content: this.newComment,
      createdAt: new Date(),
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      profilePhotoUrl: userData?.profilePhotoUrl || ''
    };
    this.authService.addCommentToPost(this.postId, comment).then(async () => {
      // Bildirim gönder (yorum yapan kişi gönderi sahibi değilse)
      if (this.post && this.post.uid && this.post.uid !== this.currentUserId) {
        await this.notificationService.addNotification(this.post.uid, {
          type: 'comment',
          postId: this.postId,
          fromUserId: this.currentUserId,
          fromFirstName: userData?.firstName || '',
          fromLastName: userData?.lastName || '',
          fromProfilePhotoUrl: userData?.profilePhotoUrl || '',
          content: this.newComment,
          createdAt: new Date(),
          read: false
        });
      }
      this.newComment = '';
      this.isCommenting = false;
    });
  }

  ngOnDestroy(): void {
    this.likeSub?.unsubscribe();
    this.retweetSub?.unsubscribe();
  }
}
