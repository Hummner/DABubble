import { AfterViewInit, Component, ElementRef, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketInterface } from '../../../interfaces/ticket.interface';
import { addDoc, arrayUnion, collection, doc, getDocs, Timestamp, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../../../services/auth.service';
import { FirestoreService } from '../../../services/firestore.service';
import { ThreadService } from '../../../services/thread.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ChannelsService } from '../../../services/channels.service';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { EmojiArrayService } from '../../../services/emoji-array.service';
import { UserMentionService } from '../../../services/user-channel-mention.service';
import { DirectMessageService } from '../../../services/direct-message.service';
import { NavbarService } from '../../../services/navbar.service';
import { EmojiServiceService } from '../../../services/emoji.service';
import { filter, take, switchMap } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { MessageService } from '../../../services/message.service';

@Component({
  selector: 'app-ticket',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatMenuModule, FormsModule],
  templateUrl: './ticket.component.html',
  styleUrl: './ticket.component.scss'
})
export class TicketComponent implements OnInit, OnChanges, AfterViewInit {
  @Output() openThread = new EventEmitter<void>();
  @Output() currentPath = new EventEmitter<string>();
  @Input() index!: number;
  @Input() ticket!: TicketInterface;
  @Input() members?: any[];
  @ViewChild('text') textRef!: ElementRef<HTMLDivElement>;
  @ViewChild('mentionTrigger') mentionMenuTrigger!: MatMenuTrigger;
  @ViewChild('channelTrigger') channelMenuTrigger!: MatMenuTrigger;
  @ViewChild('chat_input') chatInput!: ElementRef<HTMLTextAreaElement>;
  userMentionService = inject(UserMentionService);
  directMsgService = inject(DirectMessageService);
  navbarService = inject(NavbarService);
  emojiService = inject(EmojiServiceService);
  messageService = inject(MessageService);
  userName!: string;
  userImg!: string;
  time!: string;
  answers!: string;
  firestoreService = inject(FirestoreService);
  threadsService = inject(ThreadService);
  channelService = inject(ChannelsService);
  private auth = inject(AuthService);
  emojiArray = inject(EmojiArrayService);
  showPopupIndexNumber!: number;
  showMenu = false;
  channelId!: string;
  editView: boolean = false;
  editMenuOpen = false;
  editedText!: string;
  emojiMenuOpen = false;
  text!: any;
  lastThreadTime!: string;
  messageId?: string | null;
  moreEmoji: boolean = false;

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    if (this.ticket) {
      this.showName();
      this.time = this.showTime();
      this.getChannelId();
    }
  }

  getMessageId() {
    this.route.paramMap.subscribe(params => {
      this.messageId = params.get('messageId');
      return
    })
  }

  ngAfterViewInit() {
    this.text = this.showText();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticket']) {
      this.answers = this.showAnswer();
      this.time = this.showTime();
      this.lastThreadTime = this.showLastThreadTime();
      if (this.textRef) {
        this.text = this.showText();
      }
    }
  }

  get isFormValid(): boolean {
    return this.editedText?.trim() !== '';
  }

  onMouseEnter() {
    this.showMenu = true
  }

  onMouseLeave() {
    if (!this.editMenuOpen && !this.emojiMenuOpen)
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

  onEmojiMenuOpened() {
    this.emojiMenuOpen = true;
    this.showMenu = true;
  }

  onEmojiMenuClosed() {
    this.emojiMenuOpen = false;
    this.showMenu = false;
  }

  openEditView() {
    this.editView = true;
    this.editedText = this.ticket.text;
  }

  cancelEdit() {
    this.editView = false;
    setTimeout(() => {
      this.showText()
    }, 10);
  }

  editText() {
    this.channelService.editTicketText(this.getTicketRef(), this.editedText).then(() => {
      this.ticket.text = this.editedText;
      this.editView = false;
      setTimeout(() => {
        this.text = this.showText();
      }, 10);
    })
  }

  takeUser(name: string) {
    this.editedText = this.userMentionService.takeUser(name, this.editedText);
  }

  takeChannel(name: string) {
    this.editedText = this.userMentionService.takeChannel(name, this.editedText);
  }

  showPopupIndex(index: number) {
    return this.showPopupIndexNumber = index
  }

  showReactName(users: string[]) {
    let name = "Guest";
    let allUserCount = users.length - 1;
    let nameArray: string[] = [];
    let isCurrentUserReacted = false;
    users.forEach(user => {
      let userIndex = this.findUser(user);
      if (user == this.getCurrentUserId()) {
        isCurrentUserReacted = true;
      }
      if (userIndex >= 0 && this.members) {
        let userName = this.members[userIndex]['name'];
        if (user !== this.getCurrentUserId()) {
          nameArray.push(userName)
        }
      }
    })
    name = this.messageService.renderPopUpText(isCurrentUserReacted, nameArray, allUserCount)
    return name
  }

  onInputChange(event: Event) {
    this.userMentionService.onInputChange(this.editedText, this.mentionMenuTrigger, this.channelMenuTrigger, this.chatInput);
  }

  addEmoji(emoji: any) {
    this.editedText = this.emojiService.addEmojiToContent(emoji, this.editedText);
  }

  onEmojiClick(emoji: any) {
    this.addEmoji(emoji.code);
    this.emojiService.selectEmoji(emoji.name);
  }

  openThreadUrl() {
    const path = this.ticket.threads?.path;
    if (!path) return;
    const ticketpath = path.split('/')[3];
    firstValueFrom(
      this.threadsService.messagesSubscribe$
        .pipe(
          filter(arr => Array.isArray(arr)),
          take(1)
        )
    ).then(() => {
      this.router.navigate(['messages', ticketpath], { relativeTo: this.route });
    });
  }

  selectEmoji(emoji: { name: string, code: string }) {
    this.emojiService.selectEmoji(emoji.name)
    this.addEmojiToTicket(emoji.code);
  }

  openEmojiMenu(trigger: MatMenuTrigger) {
    trigger.openMenu();
  }

  async addEmojiToTicket(emoji: string) {
    let senderId = this.getCurrentUserId();
    let isEmoji: boolean = this.checkEmojiInArray(emoji);
    let isUserAddedReaction: boolean = this.checkUserReactions(senderId!);
    let reactionsCopy: { emoji: string; users: string[] }[] = [...this.ticket.reactions];
    let indexOfEmoji = this.getIndexOfEmoji(emoji);
    let ticketRef = this.getTicketRef();
    this.emojiService.addEmojiToTicket(senderId!, isEmoji, isUserAddedReaction, reactionsCopy, indexOfEmoji, emoji, this.ticket, ticketRef)
  }

  getIndexOfEmoji(emoji: string) {
    return this.ticket.reactions.findIndex(reaction => reaction.emoji === emoji);
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
    const allUsers = this.firestoreService.userList();
    
    if (allUsers) {
      const user = allUsers.find(user => user.uid == this.ticket.senderId);
      this.userName = user?.name || "Gast";
      this.userImg = user?.imgUrl || "assets/img/profile.png"
    }
  }

  showTime(): string {
    return this.ticket?.createdAt instanceof Date ? this.ticket.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
  }

  showLastThreadTime() {
    return this.ticket?.lastThread instanceof Date ? this.ticket.lastThread.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
  }

  showText() {
    if (!this.textRef.nativeElement) {
      return
    }
    this.textRef.nativeElement.innerHTML = "";
    let container = document.createElement('p');
    container.classList.add('text-link')
    let text = this.ticket.text;
    let taggedUsers = this.userMentionService.getUserList(text);
    let taggedChannels = this.userMentionService.getChannelList(text)
    let taggedArray = taggedUsers.concat(taggedChannels);
    if (taggedArray.length == 0) this.createTextElement(container, text)
    taggedArray.sort((a, b) => a.textIndex - b.textIndex)
    text = this.userMentionService.replaceTaggedText(taggedArray, text, this.index);
    this.createTextElement(container, text)
    this.createListener(taggedArray)
  }

  createListener(taggedArray: { name: string, id: string, textIndex: number, taggedType: string }[]) {
    taggedArray.forEach(tag => {
      let currentUser = this.getCurrentUserId();

      let customId = `${tag.id}_${tag.textIndex}_${this.index}`
      let tagId = document.getElementById(customId)
      tagId?.addEventListener('click', (e) => {
        e.preventDefault();
        if (tag.taggedType == "user") this.navbarService.findOrCreateDMchannel(tag.id, currentUser!)
        if (tag.taggedType == "channel") this.userMentionService.findChannel(tag.id)
      })
    })
  }

  createTextElement(container: HTMLParagraphElement, text: string) {
    container.innerHTML = text;
    this.textRef.nativeElement.appendChild(container);
  }

  showEmojiName(emoji: { emoji: string, users: string[] }) {
    let emojiCode = emoji.emoji;
    let emojiName = this.emojiService.emojiList.find(emo => { return emo.code === emojiCode })
    if (emojiName) return emojiName.name
    return
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
    let threadPath = this.ticket.threads?.path;
    let ticketPath = threadPath?.split('/').slice(0, 4).join('/')
    return doc(this.channelService.firestore, ticketPath!)
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
