import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'social-media';
  isLoggedIn: boolean = false;
  showSidebar: boolean = false;
  loading$ = this.loadingService.loading$;

  constructor(private authService: AuthService, private router: Router, private loadingService: LoadingService) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.updateSidebarVisibility(this.router.url);
    });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateSidebarVisibility(event.urlAfterRedirects);
      }
    });
  }

  private updateSidebarVisibility(currentUrl: string): void {
    this.showSidebar = this.isLoggedIn && currentUrl !== '/profile-setup' && currentUrl !== '/';
  }
}
