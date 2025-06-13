import { Component, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-register-page',
  templateUrl: './register-page.component.html',
  styleUrls: ['./register-page.component.css']
})
export class RegisterPageComponent {
  email!: string;
  password!: string;
  passwordConfirm!: string;
  errorMessage: string = '';
  successMessage: string = '';

  @Output() registrationSuccess = new EventEmitter<any>();
  @Output() registrationSuccessMessage = new EventEmitter<string>();

  constructor(private authService: AuthService, private router: Router, private loadingService: LoadingService) { }

  async onRegister() {
    if (this.password !== this.passwordConfirm) {
      this.errorMessage = 'Şifreler eşleşmiyor';
      this.successMessage = '';
      return;
    }

    this.loadingService.show();
    try {
      const result = await this.authService.register(this.email, this.password);
      this.successMessage = 'Kayıt başarılı! Lütfen profilinizi tamamlayın.';
      this.errorMessage = '';
      this.registrationSuccessMessage.emit(this.successMessage);
      // Kayıt başarılı olduğunda landing page'e haber ver
      this.registrationSuccess.emit(result.user);
    } catch (error: any) {
      // Firebase hata kodlarına göre kullanıcı dostu mesajlar
      let msg = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            msg = 'Bu e-posta ile zaten bir hesap var.';
            break;
          case 'auth/invalid-email':
            msg = 'Geçersiz e-posta adresi.';
            break;
          case 'auth/weak-password':
            msg = 'Şifreniz çok zayıf. Daha güçlü bir şifre deneyin.';
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