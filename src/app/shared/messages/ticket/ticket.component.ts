import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketInterface } from '../../../interfaces/ticket.interface';
import { addDoc, arrayUnion, collection, doc, getDocs, Timestamp, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../services/auth.service';
import { FirestoreService } from '../../../services/firestore.service';
import { ThreadService } from '../../../services/thread.service';
import { ActivatedRoute } from '@angular/router';
import { ChannelsService } from '../../../services/channels.service';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.scss'
})
export class TicketComponent implements OnInit, OnChanges {

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
  channelService = inject(ChannelsService)
  private auth = inject(AuthService);
  showPopup = false;
  showMenu = false;
  channelId!: string;

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    if (this.ticket) {
      this.showName();
      this.time = this.showTime();
      this.getChannelId();

    }

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticket']) {
      this.answers = this.showAnswer()
    }

  }


  openThreadPanel() {
    if (this.ticket.threads?.path) {
      this.getThreadPath(this.ticket.threads?.path)
      this.threadsService.getThreadsFromTicket(this.ticket.threads?.path, this.ticket);
      this.openThread.emit()
    }
  }

  async addEmojiToTicket(emoji: string) {
    let ticketRef = this.getTicketRef();
    let senderId = this.getCurrentUserId();
    let isEmoji: boolean = this.checkEmojiInArray(emoji);
    let isUserAddedReaction: boolean = this.checkUserReactions(senderId!)

    if (isEmoji && isUserAddedReaction) {
      console.log("This user yet added This emoji:", emoji);

    }

    if (isEmoji && isUserAddedReaction) {
      
    }


    try {
      await updateDoc(ticketRef, "reactions", arrayUnion())
    } catch (err) {
      console.error("Error by add a reaction", err);

    }
  }

  checkUserReactions(senderId: string) {
    let isUserAddedReaction = false;
    this.ticket.reactions.forEach((reaction) => {
      return isUserAddedReaction = reaction.users.includes(senderId)
    });
    return isUserAddedReaction
  }

  checkReaction(emoji: string, senderId: string) {
    let emojiInArray = this.checkEmojiInArray(emoji);
  }

  checkEmojiInArray(emoji: string) {
    let isEmoji = false;

    this.ticket.reactions.forEach((reaction) => {
      if (reaction.emoji == emoji) {
        isEmoji = true
      }
    })

    return isEmoji
  }



  getThreadPath(path: string) {
    return this.currentPath.emit(path)
  }

  showAnswer(): string {
    let answers = "Keine Antwort"
    let counter = this.ticket.threadsCount
    if (counter) {
      if (counter == 1) return `${counter} Antwort`
      if (counter > 1) return `${counter} Antworten`


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

  getChannelId() {
    this.route.params.subscribe((params) => {
      if (params) {
        this.channelId = params['ChannelId']
      }
    })
  }

  getTicketRef() {
    return doc(this.channelService.firestore, this.threadsService.getTicketPath())
  }


  isCurrentUser() {
    return (this.getCurrentUserId() === this.ticket.senderId)
  }

  isReaction() {
    if (this.ticket.reactions.length == 0) {
      return false;
    } else {
      return true
    }
  }
}
