import { Component, inject, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketInterface } from '../../../interfaces/ticket.interface';
import { UserProfileInterface } from '../../../interfaces/user-profile.interface';
import { AuthService } from '../../../services/auth.service';
import { FirestoreService } from '../../../services/firestore.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-thread-messages',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatIconModule, FormsModule],
  templateUrl: './thread-messages.component.html',
  styleUrl: './thread-messages.component.scss'
})
export class ThreadMessagesComponent implements OnInit, OnChanges {

  @Input() tickets!: TicketInterface[];
  @Input() index!: number;
  @Input() message!: TicketInterface;
  @Input() members?: any[];
  userName!: string;
  time!: string;
  firestoreService = inject(FirestoreService);
  private auth = inject(AuthService);
  currentUser?: string | null;
  channelId?: Subscription;
  showMenu = false;
  editMenuOpen = false;
  editView = false;
  editedText!: string;

  constructor(
    private route: ActivatedRoute
  ) {

  }

  ngOnInit(): void {
    if (this.message) {
      this.showName();
      this.time = this.showTime();

    }
    this.getChannelId();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.currentUser = this.getCurrentUserId();
    this.time = this.showTime();
  }

  onMouseEnter() {
    this.showMenu = true
  }


  onMouseLeave() {
    if (!this.editMenuOpen)
      this.showMenu = false
  }


  onEditMenuOpened() {
    this.editMenuOpen = true;
    this.showMenu = true
  }


  onEditMenuClosed() {
    this.editMenuOpen = false;
    this.showMenu = false;
  }

  openEditView() {
    this.editView = true;
    this.editedText = this.message.text;
  }

  editText() {

    


  }



  showName() {
    const userIndex = this.findUser(this.message.senderId)

    if (userIndex >= 0 && this.members && this.isMember(userIndex, this.members)) {
      this.userName = this.members[userIndex]['name']
    } else {
      this.userName = "Guest"
    }
  }


  getChannelId() {
    this.channelId = this.route.params.subscribe(params => {
      const channelId = params['ChannelId'];
      return channelId
    })
  }

  showTime(): string {
    return this.message?.createdAt instanceof Date ? this.message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
  }

  findUser(uId: string): number {
    if (this.members) {
      return this.members.findIndex(member => member.uid === uId);
    }
    return -1;
  }

  isMember(userIndex: number, members: any[]): boolean {
    return userIndex >= 0 && !!members[userIndex];
  }

  getCurrentUserId() {
    return this.auth.firebaseAuth.currentUser?.uid ?? null;
  }


  isCurrentUser() {
    return (this.getCurrentUserId() === this.message.senderId)

  }




}
