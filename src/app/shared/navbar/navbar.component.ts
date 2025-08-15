import { Component, inject, signal, computed } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NewChannelComponent } from './new-channel/new-channel.component';
import { AddChannelMemberComponent } from './add-channel-member/add-channel-member.component';
import { NavbarService } from '../../services/navbar.service';
import { AsyncPipe, NgFor, NgIf, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { DirectMessageService } from '../../services/direct-message.service';
import { ChannelsService } from '../../services/channels.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatIconModule,
    MatToolbarModule,
    MatDialogModule,
    NgFor,
    NgIf,
    AsyncPipe,
    RouterModule,
    NgClass,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  userProfile = this.firestoreService.userProfile;
  channels$ = inject(NavbarService).channelsObs$;
  channelService = inject(ChannelsService);
  readonly channelUsers = this.directMessageService.userIds;
  readonly currentUserId = computed(() => this.userProfile()?.uid);
  readonly selectedUserId = computed(() => {
    const users = this.channelUsers();
    const current = this.currentUserId();
    if (!users || !current) return null;
    return users.find((uid) => uid !== current) ?? null;
  });

  constructor(
    public dialog: MatDialog,
    private firestoreService: FirestoreService,
    private directMessageService: DirectMessageService,
    private router: Router
  ) {}

  isOpen = true;
  showChannel = true;
  showMessage = true;
  filteredChannels: any[] = [];

  toggleDrawer() {
    this.isOpen = !this.isOpen;
  }

  openDialog() {
    this.dialog
      .open(NewChannelComponent)
      .afterClosed()
      .subscribe((channelName) => {
        if (!channelName) return;
        this.dialog.open(AddChannelMemberComponent, {
          data: { channelName },
        });
      });
  }

  getOtherUserList(): UserProfileInterface[] {
    const users = this.firestoreService.userList();
    this.hideChannelWithoutCurrentUser();
    return users.filter((user) => user.uid !== this.userProfile()?.uid);
  }

  async findOrCreateDMchannel(currentUserId: string, clickedUserId: string) {
    const channelId = await this.directMessageService.getDMChannel(
      currentUserId,
      clickedUserId
    );
    this.router.navigateByUrl(`directMessages/${channelId}`);
    this.directMessageService.subDirectMessageChannel(channelId, currentUserId);
  }

  selectChannel(channelId: string) {
    this.channels$.subscribe((channels) => {
      const selectedChannel = channels.find(
        (channel) => channel.channelId === channelId
      );
      if (selectedChannel) {
        this.channelService.getChannel(selectedChannel.channelId);
        this.router.navigateByUrl(`channel/${selectedChannel.channelId}`);
        this.focusOnChannelTextarea();
      } else {
        console.error('Channel not found:', channelId);
      }
    });
  }

  async hideChannelWithoutCurrentUser() {
    this.channels$.subscribe((channels) => {
      this.filteredChannels = channels.filter((channel) => {
        return channel.members.some((member) => member.id === this.currentUserId());
      });
    });
  }

  focusOnChannelTextarea() {
    this.channelService.requestFocus();
  }

  toNewMessage(){
    this.router.navigateByUrl(`newMessage`);
  }
}
