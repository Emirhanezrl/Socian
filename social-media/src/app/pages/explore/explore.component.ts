import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.css']
})
export class ExploreComponent implements OnInit {
  searchTerm: string = '';
  userResults: any[] = [];
  posts: any[] = [];
  currentUserId: string | null = null;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUserId = user ? user.uid : null;
      this.loadAllPosts();
    });
  }

  loadAllPosts() {
    this.authService.getAllPosts().subscribe(posts => {
      this.posts = posts.map(post => ({ ...post }));
      if (this.currentUserId) {
        this.posts.forEach(post => {
          this.authService.isPostLiked(post.id, this.currentUserId!).subscribe(like => {
            post.isLiked = !!like;
          });
          this.authService.isPostRetweeted(post.id, this.currentUserId!).subscribe(retweet => {
            post.isRetweeted = !!retweet;
          });
          // Beğeni sayısı
          this.authService.getPostLikeCount(post.id).subscribe(snap => {
            post.likeCount = snap.size;
          });
          // Retweet sayısı
          this.authService.getPostRetweetCount(post.id).subscribe(snap => {
            post.retweetCount = snap.size;
          });
          // Yorum sayısı
          this.authService.getCommentsForPost(post.id).subscribe(snap => {
            post.commentCount = snap.length;
          });
        });
      } else {
        this.posts.forEach(post => {
          // Beğeni sayısı
          this.authService.getPostLikeCount(post.id).subscribe(snap => {
            post.likeCount = snap.size;
          });
          // Retweet sayısı
          this.authService.getPostRetweetCount(post.id).subscribe(snap => {
            post.retweetCount = snap.size;
          });
          // Yorum sayısı
          this.authService.getCommentsForPost(post.id).subscribe(snap => {
            post.commentCount = snap.length;
          });
        });
      }
    });
  }

  onSearchChange() {
    const term = this.searchTerm.trim().toLowerCase();
    if (term.length < 2) {
      this.userResults = [];
      this.loadAllPosts();
      return;
    }
    this.authService.searchUsersByUsername(term).subscribe(users => {
      this.userResults = users;
      this.posts = [];
    });
  }

  toggleLike(post: any, event: Event) {
    event.stopPropagation();
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

  toggleRetweet(post: any, event: Event) {
    event.stopPropagation();
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
