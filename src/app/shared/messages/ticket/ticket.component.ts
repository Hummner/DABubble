import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketInterface } from '../../../interfaces/ticket.interface';
import { getDocs, Timestamp } from '@angular/fire/firestore';
import { tick } from '@angular/core/testing';

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

  showPopup = false;
  showMenu = false;

  constructor() {




  }

  ngOnInit(): void {
    console.log(this.ticket.senderId);
    this.userName = this.findUser(this.ticket.senderId)


  }

  findUser(uId: string) {
    if (this.members) {
      let userIndex = this.members.findIndex(member => member.uid === uId);
      console.log(userIndex);
      let user = this.members[userIndex]['name']
      console.log(this.members);
      return user
    }
  }

  reactionsUsers(index: number) {
    let userArray = this.ticket.reactions[index]['users']


  }


}
