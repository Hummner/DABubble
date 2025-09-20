import { Component, Inject, ViewChild, ElementRef, HostListener, OnInit, AfterViewInit, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { FirestoreService } from '../../services/firestore.service';
import { NavbarInterface } from '../../interfaces/navbar.interface';
import { updateDoc, arrayUnion, Firestore, doc, getDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ChannelsService } from '../../services/channels.service';

@Component({
  selector: 'app-add-member',
  standalone: true,
  imports: [FormsModule, NgClass, CommonModule, RouterModule],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss',
})
export class AddMemberComponent implements OnInit, AfterViewInit {
  userProfile = this.firestoreService.userProfile;
  user: UserProfileInterface | null = null;
  navbar: Partial<NavbarInterface> = {};
  channelsService = inject(ChannelsService);
  channelName = '';
  channelId = '';
  searchText = '';
  members: { id: string; role: string; name: string; imgUrl: string }[] = [];
  availibleMembers: UserProfileInterface[] = [];
  filteredMembers: UserProfileInterface[] = [];
  

  @ViewChild('sheetBox') sheetBox!: ElementRef<HTMLElement>;
  isMobileView = false;
  private closing = false;

  constructor(
    private addMemberRef: MatDialogRef<AddMemberComponent>,
    private firestore: Firestore,
    private firestoreService: FirestoreService,
    private router: Router,

    @Inject(MAT_DIALOG_DATA) data: { channelName: string; channelId: string }
  ) {
    this.channelName = data?.channelName ?? '';
    this.channelId = data?.channelId ?? '';
  }

  ngOnInit(): void {
    this.updateViewportFlag();
  }

  ngAfterViewInit(): void {
    if (this.isMobileView) {
      requestAnimationFrame(() => this.sheetBox?.nativeElement.classList.add('slide-in'));
    }
  }

  @HostListener('window:resize')
  onResize() {
    const wasMobile = this.isMobileView;
    this.updateViewportFlag();
    if (wasMobile !== this.isMobileView && this.sheetBox) {
      const el = this.sheetBox.nativeElement;
      el.classList.remove('slide-in', 'slide-out');
      if (this.isMobileView) requestAnimationFrame(() => el.classList.add('slide-in'));
    }
  }

  private updateViewportFlag() {
    this.isMobileView = window.innerWidth < 992;
  }

  closeDialog() {
    if (!this.isMobileView) {
      this.addMemberRef.close();
      return;
    }
    if (this.closing) return;
    this.closing = true;
    const el = this.sheetBox?.nativeElement;
    if (!el) {
      this.addMemberRef.close();
      return;
    }
    el.classList.remove('slide-in');
    el.classList.add('slide-out');
    setTimeout(() => this.addMemberRef.close(), 300);
  }

  addMember(userId: string) {
    for (let i = 0; i < this.availibleMembers.length; i++) {
      if (this.availibleMembers[i].uid === userId) {
        this.fillInterfaceWithMember(this.availibleMembers[i]);
        this.searchText = '';
      }
    }
  }

  fillInterfaceWithMember(data: any) {
    const newMember = {
      id: data.uid,
      role: data.uid === this.userProfile()?.uid ? 'admin' : 'member',
      name: data.name,
      imgUrl: data.imgUrl,
    };

    if (!this.members.find((m) => m.id === newMember.id)) {
      this.members.push(newMember);
    }
    this.navbar.members = this.members;
    return this.navbar;
  }

  deleteMember(userId: string) {
    for (let i = 0; i < this.members.length; i++) {
      if (this.members[i].id === userId) {
        this.members.splice(i, 1);
      }
    }
  }

  isDisabled(): boolean {
    return this.members.length === 0;
  }

  async getMembersInCurrentChannel() {
    const currentChannel = await this.channelsService.getCurrentChannel(this.channelId);

    if (currentChannel) {
      const currentMembers = currentChannel.members.map((member: any) => member.id);
      this.filteredMembers = this.firestoreService
        .userList()
        .filter((user) => !currentMembers.includes(user.uid));
    } else {
      this.filteredMembers = [];
    }
  }

  async searchUser() {
    this.searchText = this.searchText.trim();
    if (this.searchText !== '') {
      await this.getMembersInCurrentChannel();
      this.availibleMembers = this.filteredMembers.filter((user) =>
        user.name.toLowerCase().includes(this.searchText.toLowerCase())
      );
    } else {
      this.availibleMembers = [];
    }
    return this.availibleMembers;
  }

  addNewMemberToChannel() {
    this.updateChannel();
  }

  updateChannel() {
    const channelRef = doc(this.firestore, 'channels', this.channelId);
    updateDoc(channelRef, {
      members: arrayUnion(...(this.navbar.members || [])),
      channelId: this.channelId,
    })
      .then(() => {
        console.log('Member added successfully');
      })
      .catch((error) => {
        console.error('Error adding member to channel:', error);
      });
    this.closeDialog();
    this.router.navigate(['/channel', this.channelId]);
  }
}
