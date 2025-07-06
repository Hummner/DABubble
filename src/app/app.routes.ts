import { Routes } from '@angular/router';
import { ChannelComponent } from './channel/channel.component';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { AvatarSelectionComponent } from './auth/avatar-selection/avatar-selection.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { NewPasswordComponent } from './auth/reset-password/new-password/new-password.component';

export const routes: Routes = [
  { path: 'channel', component: ChannelComponent },
  { path: '', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'avatarSelection', component: AvatarSelectionComponent },
  { path: 'resetPassword', component: ResetPasswordComponent },
  { path: 'resetPassword/newPassword', component: NewPasswordComponent },
];
