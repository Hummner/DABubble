import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketInterface } from '../../../interfaces/ticket.interface';
import { UserProfileInterface } from '../../../interfaces/user-profile.interface';
import { AuthService } from '../../../services/auth.service';
import { FirestoreService } from '../../../services/firestore.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { EmojiArrayService } from '../../../services/emoji-array.service';
import { ChannelsService } from '../../../services/channels.service';
import { doc, getDocs, Timestamp, updateDoc } from '@angular/fire/firestore';
import { ThreadService } from '../../../services/thread.service';
import { UserMentionService } from '../../../services/user-channel-mention.service';
import { NavbarService } from '../../../services/navbar.service';
import { EmojiServiceService } from '../../../services/emoji.service';
import { MessageService } from '../../../services/message.service';

@Component({
  selector: 'app-thread-messages',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatIconModule, FormsModule],
  templateUrl: './thread-messages.component.html',
  styleUrl: './thread-messages.component.scss'
})
export class ThreadMessagesComponent implements OnInit, OnChanges, AfterViewInit {

  @ViewChild('text') textRef!: ElementRef<HTMLDivElement>;
  @ViewChild('mentionTrigger') mentionMenuTrigger!: MatMenuTrigger;
  @ViewChild('channelTrigger') channelMenuTrigger!: MatMenuTrigger;
  @ViewChild('chat_input') chatInput!: ElementRef<HTMLTextAreaElement>;

  @Input() tickets!: TicketInterface[];
  @Input() message!: TicketInterface;
  @Input() members?: any[];
  @Input() index!: number;
  @Input() isCurrentEdited!: boolean;
  userName!: string;
  time!: string;
  firestoreService = inject(FirestoreService);
  private auth = inject(AuthService);
  emojiArray = inject(EmojiArrayService);
  emojiService = inject(EmojiServiceService)
  channelService = inject(ChannelsService);
  threadService = inject(ThreadService);
  userMentionService = inject(UserMentionService);
  navbarService = inject(NavbarService);
  messageService = inject(MessageService);
  currentUser?: string | null;
  channelId?: string;
  messageId?: string;
  showMenu = false;
  editMenuOpen = false;
  editView = false;
  editedText!: string;
  emojiMenuOpen = false;
  showPopup = false;
  userImg!: string;
  text!: void;
  moreEmoji: boolean = false;
  showPopupIndexNumber!: number;
  reactions!: any;

  constructor(
    private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    this.reactions = this.message?.reactions ?? [];
  }

  getChannelInfo() {
    if (this.channelId) {
      this.channelService.getChannel(this.channelId);
    }
    return
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.showName();
      this.time = this.showTime();
      this.text = this.showText();
    }, 1)

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      const nextMsg = changes['message'].currentValue as { reactions?: any[] } | undefined;
      this.reactions = nextMsg?.reactions ?? [];
      this.text = this.showText();
    }
    this.currentUser = this.getCurrentUserId();
    this.time = this.showTime();
    this.showName();
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

  onEmojiMenuOpened() {
    this.emojiMenuOpen = true;
    this.showMenu = true
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

  onEmojiMenuClosed() {
    this.emojiMenuOpen = false;
    this.showMenu = false;
  }

  selectEmoji(emoji: { name: string, code: string }) {
    this.emojiService.selectEmoji(emoji.name)
    this.addEmojiToTicket(emoji.code);
  }

  showEmojiName(emoji: { emoji: string, users: string[] }) {
    let emojiCode = emoji.emoji;
    let emojiName = this.emojiService.emojiList.find(emo => { return emo.code === emojiCode })
    if (emojiName) return emojiName.name
    return
  }

  openEmojiMenu(trigger: MatMenuTrigger) {
    trigger.openMenu();
  }

  editText() {
    this.channelService.editTicketText(this.getThreadMessageRef(), this.editedText).then(() => {
      this.message.text = this.editedText;
      this.threadService.reemitCurrentTicket();
      this.editView = false;
      setTimeout(() => {
        this.text = this.showText();
      }, 10);
    })
  }

  cancelEdit() {
    this.editView = false;
    setTimeout(() => {
      this.showText()
    }, 10);
  }

  onEmojiClick(emoji: any) {
    this.addEmoji(emoji.code);
    this.emojiService.selectEmoji(emoji.name);
  }

  addEmoji(emoji: any) {
    this.editedText = this.emojiService.addEmojiToContent(emoji, this.editedText);
  }

  onInputChange(event: Event) {
    this.userMentionService.onInputChange(this.editedText, this.mentionMenuTrigger, this.channelMenuTrigger, this.chatInput);
  }

  takeUser(name: string) {
    this.editedText = this.userMentionService.takeUser(name, this.editedText);
  }

  takeChannel(name: string) {
    this.editedText = this.userMentionService.takeChannel(name, this.editedText);
  }

  isReaction() {
    if (this.message?.reactions.length == 0) {
      return false;
    } else {
      return true
    }
  }

 showName() {
    const allUsers = this.firestoreService.userList();
  
    if (allUsers && this.message.senderId) {
      const user = allUsers.find(user => user.uid == this.message.senderId);
      this.userName = user?.name || "Gast";
      this.userImg = user?.imgUrl || "assets/img/profile.png"
    }
  }

  async addEmojiToTicket(emoji: string) {
    let senderId = this.getCurrentUserId();
    let isEmoji: boolean = this.checkEmojiInArray(emoji);
    let isUserAddedReaction: boolean = this.checkUserReactions(senderId!);
    let reactionsCopy: { emoji: string; users: string[] }[] = [...this.message.reactions];
    let indexOfEmoji = this.getIndexOfEmoji(emoji);
    let ticketRef = this.getThreadMessageRef()
    this.emojiService.addEmojiToTicket(senderId!, isEmoji, isUserAddedReaction, reactionsCopy, indexOfEmoji, emoji, this.message, ticketRef)
  }

  showText() {
    if (!this.message) return
    if (this.textRef) {
      let container = document.createElement('p');
      let text = this.message.text;
      let taggedUsers = this.userMentionService.getUserList(text);
      let taggedChannels = this.userMentionService.getChannelList(text)
      let taggedArray = taggedUsers.concat(taggedChannels);

      this.textRef.nativeElement.innerHTML = "";
      container.classList.add('text-link')
      container.style.margin = '0';
      if (taggedArray.length == 0) this.createTextElement(container, text)
      taggedArray.sort((a, b) => a.textIndex - b.textIndex)
      text = this.userMentionService.replaceTaggedText(taggedArray, text, this.index);
      this.createTextElement(container, text)
      this.createListener(taggedArray)
    }
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

  getIndexOfEmoji(emoji: string) {
    return this.message.reactions.findIndex(reaction => reaction.emoji === emoji);
  }

  checkUserReactions(senderId: string) {
    let isUserAddedReaction = false;
    this.message.reactions.forEach((reaction) => {
      return isUserAddedReaction = reaction.users.includes(senderId)
    });
    return isUserAddedReaction
  }

  checkReaction(emoji: string, senderId: string) {
    let emojiInArray = this.checkEmojiInArray(emoji);
  }

  checkEmojiInArray(emoji: string) {
    let isEmoji = false;

    this.message.reactions.forEach((reaction) => {
      if (reaction.emoji == emoji) {
        isEmoji = true
      }
    })
    return isEmoji
  }

  getThreadMessageRef() {
    let path = this.threadService.getThreadMesssageRef(this.message.threadMessageId!)
    return path
  }

  getChannelId() {
    this.route.paramMap.subscribe(params => {
      const channelId = params.get('ChannelId');
      return channelId
    })
  }

  getMessageId() {
    this.route.paramMap.subscribe(params => {
      const messageId = params.get('messageId');
      return messageId
    })
  }

  getTicketRef() {
    let threadPath = this.message.threads?.path;
    let ticketPath = threadPath?.split('/').slice(0, 4).join('/')
    return doc(this.channelService.firestore, ticketPath!)
  }

  showTime(): string {
    if (this.message?.createdAt instanceof Date) return this.message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (this.message?.createdAt instanceof Timestamp) return this.messageService.convertToDate(this.message.createdAt);
    return "No Time"
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
    if (this.message) {
      return (this.getCurrentUserId() === this.message.senderId)
    }
    return
  }

  get isFormValid(): boolean {
    return this.editedText?.trim() !== '';
  }

}


