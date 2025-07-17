import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { UserProfileInterface } from '../../interfaces/user-profile.interface';
import { Message } from '../../interfaces/message.interface';
import { CommonModule } from '@angular/common';
import { Timestamp } from '@angular/fire/firestore';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-message-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-ticket.component.html',
  styleUrl: './message-ticket.component.scss',
})
export class MessageTicketComponent implements OnChanges {
  @Input() userProfileB!: UserProfileInterface | null;
  @Input() userProfile!: UserProfileInterface | null;
  @Input() message!: Message;
  senderId = '';
  user!: UserProfileInterface | null | undefined;

  ngOnChanges(): void {
    const userList = this.firestore.userList;
    this.user = userList.find((user) => user.uid === this.message.senderId);
    console.log(this.user);
  }
  constructor(private firestore: FirestoreService) {}
  isTimestamp(value: any): value is Timestamp {
    return value instanceof Timestamp;
  }
}
