import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  email!: string;
  password!: string;
  errorMessage: string = '';
  successMessage: string = '';
  @Output() loginSuccessMessage = new EventEmitter<string>();

  constructor(private authService: AuthService, private router: Router, private loadingService: LoadingService) { }

  async onLogin() {
    this.loadingService.show();
    try {
      await this.authService.login(this.email, this.password);
      this.successMessage = 'Giriş başarılı! Yönlendiriliyorsunuz...';
      this.errorMessage = '';
      this.loginSuccessMessage.emit(this.successMessage);
      setTimeout(() => {
        this.router.navigate(['/']);
      }, 1500);
    } catch (error: any) {
      // Firebase hata kodlarına göre kullanıcı dostu mesajlar
      let msg = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            msg = 'Kayıt bulunamadı, e-posta veya şifrenizi kontrol edin.';
            break;
          case 'auth/wrong-password':
            msg = 'Şifreniz hatalı, tekrar deneyin.';
            break;
          case 'auth/invalid-email':
            msg = 'Geçersiz e-posta adresi.';
            break;
          case 'auth/too-many-requests':
            msg = 'Çok fazla deneme yaptınız, lütfen daha sonra tekrar deneyin.';
            break;
        }
      }
      this.errorMessage = msg;
      this.successMessage = '';
    } finally {
      this.loadingService.hide();
    }
  }
} 