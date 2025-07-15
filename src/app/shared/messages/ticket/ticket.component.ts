import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketInterface } from '../../../interfaces/ticket.interface';
import { getDocs, Timestamp } from '@angular/fire/firestore';
import { AuthService } from '../../../services/auth.service';
import { FirestoreService } from '../../../services/firestore.service';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.scss'
})
export class TicketComponent implements OnInit {

  @Output() openThread = new EventEmitter<void>;
  @Input() index!: number;
  @Input() ticket!: TicketInterface;
  @Input() members?: any[];
  userName!: string;
  firestoreService = inject(FirestoreService)
  private auth = inject(AuthService);

  showPopup = false;
  showMenu = false;

  constructor() {




  }

  ngOnInit(): void {
    console.log(this.ticket.senderId);
    this.showName();


  }

  showName() {
    const userIndex = this.findUser(this.ticket.senderId)

    if (userIndex >= 0 && this.members && this.isMember(userIndex, this.members)) {
      this.userName = this.members[userIndex]['name']
    } else {
      this.userName = "Guest"
    }



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

  //   showName() {
  //   this.userName = this.findUser(this.ticket.senderId)



  // }

  // findUser(uId: string) {
  //   if (this.members) {
  //     let userIndex = this.members.findIndex(member => member.uid === uId);
  //     console.log(userIndex);
  //     let userName = this.isMember(userIndex, this.members);
  //     return userName
  //   }
  // }

  // isMember(userIndex: number, members: any[]) {
  //   if (userIndex >= 0) {
  //     let user = members[userIndex]['name']
  //     console.log(this.members);
  //     return user
  //   } else {
  //     return "Guest"
  //   }
  // }

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
