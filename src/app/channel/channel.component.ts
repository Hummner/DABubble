import { Component, ElementRef, inject, OnDestroy, OnInit, output, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ThreadComponent } from './thread/thread.component';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { TicketComponent } from '../shared/messages/ticket/ticket.component';
import { ChannelsService } from '../services/channels.service';
import { ChannelInterface } from '../interfaces/channel.interface';
import { FormsModule } from '@angular/forms';
import { user } from '@angular/fire/auth';
import { AuthService } from '../services/auth.service';
import { FirestoreService } from '../services/firestore.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TicketInterface } from '../interfaces/ticket.interface';
import { ThreadService } from '../services/thread.service';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [MatIconModule, MatSidenavModule, ThreadComponent, MatMenuModule, CommonModule, TicketComponent, FormsModule],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss',
})
export class ChannelComponent implements OnInit, OnDestroy {

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('discInput') discInput!: ElementRef<HTMLInputElement>;



  channelsService = inject(ChannelsService);
  threadsServvice = inject(ThreadService)
  firestoreService = inject(FirestoreService)
  private auth = inject(AuthService);
  showMenu = false;
  menuOpen = false;
  editName = false;
  editDisc = false;
  channel: ChannelInterface | null = null;
  textInput: string = "";
  private channelSubscription?: Subscription;
  private messagesSubscription?: Subscription;
  messages: TicketInterface[] = [];
  channelId!: string;
  routeSub?: Subscription;
  isThreadOpen = false;
  currentThreadPath?: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.getActiveRoute();
    this.channelSubscription = this.channelsService.channel$.subscribe(channel => {
      if (channel) {
        this.channel = channel;
        console.log('Channel empfangen:', this.channel);
      }
    });

    this.getChannelInfo();
    this.messagesSubscription = this.channelsService.messages$.subscribe(msgs => {
      if (this.channel) {
        this.channel.messages = msgs;
        console.log(this.channel.messages[0].threads?.path);
      }

    });





  }

  currentThreadPathRef(data: string) {
    this.currentThreadPath = data
  }

  getActiveRoute() {
    this.route.params.subscribe((params) => {
      if (params) {
        this.channelId = params['ChannelId']
      }
    })
  }


  getCurrentUserId(): string | null {
    return this.auth.firebaseAuth.currentUser?.uid ?? null;
  }

  openMenu(trigger: MatMenuTrigger) {
    trigger.openMenu();
    this.menuOpen = true;
  }

  closeMenu(trigger: MatMenuTrigger) {
    trigger.closeMenu();
  }

  editChannel(editField: string) {
    if (editField === "editName") {
      this.editName = true;
      this.nameInput.nativeElement.focus();
      this.focusAfterText(this.nameInput);
    }
    if (editField === "editDisc") {
      this.editDisc = true;
      setTimeout(() => {
        this.discInput.nativeElement.focus();
        this.focusAfterText(this.discInput);
      }, 1);
    }
  }

  focusAfterText(inputRef: ElementRef<HTMLInputElement>) {
    let input = inputRef.nativeElement;
    let length = input.value.length;
    input.setSelectionRange(length, length);

  }

  editChannelClose(editField: string) {
    if (editField === "editName") {
      this.editName = false;
      this.nameInput.nativeElement.blur();
    }
    if (editField === "editDisc") {
      this.editDisc = false;
      this.discInput.nativeElement.blur();
    }
  }

  getChannelInfo() {
    return this.channelsService.getChannel(this.channelId);
  }

  addTicket() {
    const currentUser = this.getCurrentUserId();
    const textMessage = this.textInput;
    console.log(currentUser, ": ", textMessage);

    if (currentUser && textMessage) {
      this.channelsService.addTicketToChannel("KRIw2GN8Ym9EQmijM84l", currentUser, textMessage)
    } else {
      console.error("No User or Text");
    }
  }

  ngOnDestroy(): void {
    this.channelSubscription?.unsubscribe();
    this.messagesSubscription?.unsubscribe();
    console.log("Unsubscribed on Channel");

  }



}
