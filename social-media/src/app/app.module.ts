import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HomeComponent } from './pages/home/home.component';
import { ExploreComponent } from './pages/explore/explore.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { MessagesComponent } from './pages/messages/messages.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ProfileSettingsComponent } from './pages/profile-settings/profile-settings.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { PostDetailComponent } from './pages/post-detail/post-detail.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { RegisterPageComponent } from './register-page/register-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { ProfileSetupPageComponent } from './profile-setup-page/profile-setup-page.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { TimeAgoPipe } from './pages/home/time-ago.pipe';
import { LoadingComponent } from './components/loading.component';

// Firebase için gerekli importlar:
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { environment } from '../environments/environment';

// Forms için (login/register form inputları çalışsın diye)
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    HomeComponent,
    ExploreComponent,
    NotificationsComponent,
    MessagesComponent,
    ProfileComponent,
    ProfileSettingsComponent,
    SettingsComponent,
    PostDetailComponent,
    NotFoundComponent,
    RegisterPageComponent,
    LoginPageComponent,
    ProfileSetupPageComponent,
    LandingPageComponent,
    TimeAgoPipe,
    LoadingComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
