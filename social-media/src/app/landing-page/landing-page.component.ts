import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements OnInit {
  showLogin: boolean = true; // Varsayılan olarak giriş formunu göster
  showProfileSetup: boolean = false; // Profil kurulum sayfasını gösterme durumu
  newlyRegisteredUser: any = null; // Yeni kayıt olan kullanıcı bilgilerini tutacak
  successMessage: string = '';

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    // Sadece oturum açmış ve henüz profil kurulumu yapmamış kullanıcıları ana sayfaya yönlendir
    this.authService.currentUser$.subscribe(user => {
      if (user && !this.showProfileSetup) {
        this.router.navigate(['/home']);
      }
    });
  }
  
  // Giriş/Kayıt form görünümünü değiştirmek için
  toggleForm(formType: string): void {
    this.showLogin = formType === 'login';
    // Form değiştiğinde profil kurulum görünümünü kapat
    this.showProfileSetup = false;
  }
  
  // Kayıt işlemi başarılı olduğunda çağrılacak
  onRegistrationSuccess(user: any): void {
    this.showProfileSetup = true;
    this.newlyRegisteredUser = user;
  }

  onRegistrationSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  onLoginSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  onProfileSetupSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}