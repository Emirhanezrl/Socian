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

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.loadAllPosts();
  }

  loadAllPosts() {
    this.authService.getAllPosts().subscribe(posts => {
      this.posts = posts;
    });
  }

  onSearchChange() {
    const term = this.searchTerm.trim().toLowerCase();
    if (term.length < 2) {
      this.userResults = [];
      // Arama kutusu boşsa postları tekrar göster
      this.loadAllPosts();
      return;
    }
    // Firestore'da kullanıcı adında arama
    this.authService.searchUsersByUsername(term).subscribe(users => {
      this.userResults = users;
      // Arama yapılırken postları gizle
      this.posts = [];
    });
  }
}
