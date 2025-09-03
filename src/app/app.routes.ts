import { Routes } from '@angular/router';
import { ChannelComponent } from './channel/channel.component';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { AvatarSelectionComponent } from './auth/avatar-selection/avatar-selection.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { NewPasswordComponent } from './auth/reset-password/new-password/new-password.component';
import { DirectMessagesComponent } from './direct-messages/direct-messages.component';
import { ThreadDirectMessageComponent } from './direct-messages/thread-direct-message/thread-direct-message.component';
import { NewMessageComponent } from './new-message/new-message.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ImpressumComponent } from './impressum/impressum.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'channel/:ChannelId', component: ChannelComponent },
  { path: '', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'avatarSelection', component: AvatarSelectionComponent },
  { path: 'resetPassword', component: ResetPasswordComponent },
  { path: 'resetPassword/newPassword', component: NewPasswordComponent },
  {
    path: 'directMessages/:id',
    component: DirectMessagesComponent,
    children: [{ path: 'threadMessages/:messageId', component: ThreadDirectMessageComponent }],
  },
  { path: 'newMessage', component: NewMessageComponent },
  { path: 'impressum', component: ImpressumComponent },
];
