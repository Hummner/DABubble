import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketInterface } from '../../../interfaces/ticket.interface';
import { getDocs, Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../../../services/auth.service';
import { FirestoreService } from '../../../services/firestore.service';
import { ThreadService } from '../../../services/thread.service';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.scss'
})
export class TicketComponent implements OnInit {

  @Output() openThread = new EventEmitter<void>();
  @Output() currentPath = new EventEmitter<string>()
  @Input() index!: number;
  @Input() ticket!: TicketInterface;
  @Input() members?: any[];
  userName!: string;
  time!: string;
  answers!: string;
  firestoreService = inject(FirestoreService);
  threadsService = inject(ThreadService);
  private auth = inject(AuthService);
  showPopup = false;
  showMenu = false;

  constructor() { }

  ngOnInit(): void {
    if (this.ticket) {
      this.showName();
      this.time = this.showTime();
      this.answers = this.showAnswer();

    }

  }


  openThreadPanel() {
    if (this.ticket.threads?.path) {
      this.getThreadPath(this.ticket.threads?.path)
      this.threadsService.getThreadsFromTicket(this.ticket.threads?.path, this.ticket);
      this.openThread.emit()
    }
  }


  getThreadPath(path: string) {
    return this.currentPath.emit(path)
  }

  showAnswer(): string {
    let answers = "Keine Antwort"
    let counter = this.ticket.threadsCount
    if (counter) {
       if (counter == 1) return `${counter} Antwort`
      if (counter > 0) return `${counter} Antworten`


    }
    return answers
  }


  showName() {
    const userIndex = this.findUser(this.ticket.senderId)

    if (userIndex >= 0 && this.members && this.isMember(userIndex, this.members)) {
      this.userName = this.members[userIndex]['name']
    } else {
      this.userName = "Guest"
    }
  }


  showTime(): string {
    return this.ticket?.createdAt instanceof Date ? this.ticket.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
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


  reactionsUsers(index: number) {
    let userArray = this.ticket.reactions[index]['users']
  }

  getCurrentUserId(): string | null {
    return this.auth.firebaseAuth.currentUser?.uid ?? null;
  }


  isCurrentUser() {
    return (this.getCurrentUserId() === this.ticket.senderId)
  }

  isReaction() {
    if (this.ticket.reactions.length == 0) {
      return true;
    } else {
      return false
    }
  }
}
