import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ImageUploadService } from '../services/image-upload.service';
import { take } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Component({
  selector: 'app-profile-setup-page',
  templateUrl: './profile-setup-page.component.html',
  styleUrls: ['./profile-setup-page.component.css']
})
export class ProfileSetupPageComponent implements OnInit {
  @Input() registeredUser: any; // Landing page'den gelen yeni kayıtlı kullanıcı bilgisi
  @Output() profileSetupSuccessMessage = new EventEmitter<string>();
  
  coverPhotoFile: File | null = null;
  profilePhotoFile: File | null = null;
  biography: string = '';
  errorMessage: string = '';
  currentUserUid: string | null = null;
  username: string = '';
  successMessage: string = '';
  firstName: string = '';
  lastName: string = '';
  profilePhotoPreview: string | null = null;
  coverPhotoPreview: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private afAuth: AngularFireAuth,
    private imageUploadService: ImageUploadService,
    private loadingService: LoadingService
  ) { }

  ngOnInit(): void {
    // Eğer landing page'den kullanıcı bilgisi gelmişse, doğrudan kullan
    if (this.registeredUser) {
      this.currentUserUid = this.registeredUser.uid;
    } else {
      // Değilse mevcut oturum durumunu kontrol et
      this.afAuth.authState.pipe(take(1)).subscribe(user => {
        if (user) {
          this.currentUserUid = user.uid;
        } else {
          // Oturum açılmamışsa giriş sayfasına gitme - landing page içinde
          // olduğumuz için sadece hata mesajı gösterelim
          this.errorMessage = 'Oturum bilgisi bulunamadı';
        }
      });
    }
  }

  onProfilePhotoSelected(event: any) {
    this.profilePhotoFile = event.target.files[0];
    if (this.profilePhotoFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePhotoPreview = e.target.result;
      };
      reader.readAsDataURL(this.profilePhotoFile);
    } else {
      this.profilePhotoPreview = null;
    }
  }

  onCoverPhotoSelected(event: any) {
    this.coverPhotoFile = event.target.files[0];
    if (this.coverPhotoFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.coverPhotoPreview = e.target.result;
      };
      reader.readAsDataURL(this.coverPhotoFile);
    } else {
      this.coverPhotoPreview = null;
    }
  }

  async saveProfile() {
    if (!this.currentUserUid) {
      this.errorMessage = 'Kullanıcı bilgisi bulunamadı.';
      this.successMessage = '';
      return;
    }
    if (!this.username || this.username.trim().length < 3) {
      this.errorMessage = 'Kullanıcı adı en az 3 karakter olmalı.';
      this.successMessage = '';
      return;
    }
    if (!this.firstName || this.firstName.trim().length < 2) {
      this.errorMessage = 'Ad en az 2 karakter olmalı.';
      this.successMessage = '';
      return;
    }
    if (!this.lastName || this.lastName.trim().length < 2) {
      this.errorMessage = 'Soyad en az 2 karakter olmalı.';
      this.successMessage = '';
      return;
    }

    let uploadedProfilePhotoUrl: string = '';
    let uploadedCoverPhotoUrl: string = '';

    this.loadingService.show();
    try {
      if (this.profilePhotoFile) {
        uploadedProfilePhotoUrl = await this.imageUploadService.uploadImage(
          this.profilePhotoFile,
          `profile_photos/${this.currentUserUid}`
        ).toPromise() || '';
      }
      if (this.coverPhotoFile) {
        uploadedCoverPhotoUrl = await this.imageUploadService.uploadImage(
          this.coverPhotoFile,
          `cover_photos/${this.currentUserUid}`
        ).toPromise() || '';
      }

      await this.authService.saveUserData(
        this.currentUserUid,
        uploadedCoverPhotoUrl,
        uploadedProfilePhotoUrl,
        this.biography,
        this.username,
        this.firstName,
        this.lastName
      );
      this.successMessage = 'Profil başarıyla kaydedildi! Yönlendiriliyorsunuz...';
      this.errorMessage = '';
      this.profileSetupSuccessMessage.emit(this.successMessage);
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1500);
    } catch (error: any) {
      this.errorMessage = error.message;
      this.successMessage = '';
    } finally {
      this.loadingService.hide();
    }
  }
} 