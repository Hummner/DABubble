import { Routes } from '@angular/router';
import { ChannelComponent } from './channel/channel.component';
import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
    {path: "channel", component: ChannelComponent},
    {path:"", component:LoginComponent}
];
