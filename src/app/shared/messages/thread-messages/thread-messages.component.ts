import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketInterface } from '../../../interfaces/ticket.interface';
import { UserProfileInterface } from '../../../interfaces/user-profile.interface';
import { AuthService } from '../../../services/auth.service';
import { FirestoreService } from '../../../services/firestore.service';
import { ActivatedRoute } from '@angular/router';
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

@Component({
  selector: 'app-thread-messages',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatIconModule, FormsModule],
  templateUrl: './thread-messages.component.html',
  styleUrl: './thread-messages.component.scss'
})
export class ThreadMessagesComponent implements OnInit, OnChanges, AfterViewInit {

  @ViewChild('text') textRef!: ElementRef<HTMLDivElement>;

  @Input() tickets!: TicketInterface[];
  @Input() message!: TicketInterface;
  @Input() members?: any[];
  userName!: string;
  time!: string;
  firestoreService = inject(FirestoreService);
  private auth = inject(AuthService);
  emojiArray = inject(EmojiArrayService);
  channelService = inject(ChannelsService);
  threadService = inject(ThreadService);
  userMentionService = inject(UserMentionService);
  navbarService = inject(NavbarService)
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

  constructor(
    private route: ActivatedRoute
  ) {

  }

  ngOnInit(): void {


    // debugger
    //      this.getChannelId();
    //   this.getChannelInfo()
    // this.getMessageId();
    // if (this.messageId) {
    //   console.log("This is message id: ", this.messageId);
 


    // }
    


    if (this.message) {
      this.showName();
      this.time = this.showTime();

    }




  }

  getChannelInfo() {
    if (this.channelId) {
      this.channelService.getChannel(this.channelId);

    }
    return

  }

  ngAfterViewInit() {
    console.log(this.textRef);
    this.text = this.showText();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log(changes);
    if (changes['message']) {
      if (this.textRef) {
        this.text = this.showText();
      }
    }

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

  onEmojiMenuOpened() {
    this.emojiMenuOpen = true;
    this.showMenu = true
    console.log("Emojimenuopend");

  }

  showText() {
    let container = document.createElement('p');
    container.classList.add('text-link')
    let text = this.message.text;
    let taggedUsers = this.getUserList(text);
    let lastIndex = 0;
    if (taggedUsers.length == 0) return this.createText(container, text);

    taggedUsers.forEach(user => {
      let tag = `@${user.name}`
      let idx = text.indexOf(tag, lastIndex)

      if (idx !== -1) {
        const before = text.substring(lastIndex, idx);
        if (before) container.appendChild(document.createTextNode(before))
        const a = this.createLinkElement(user)
        container.appendChild(a);
        lastIndex = idx + tag.length
      }
      this.createTextAfterLink(lastIndex, text, container);
    })
    return
  }

  createText(container: HTMLParagraphElement, text: string) {
    container.innerHTML = text.trim();
    this.textRef.nativeElement.innerHTML = '';
    this.textRef.nativeElement.appendChild(container);
  }

  createTextAfterLink(lastIndex: number, text: string, container: HTMLParagraphElement) {
    if (lastIndex < text.length) {
      container.appendChild(document.createTextNode(text.substring(lastIndex)))
    }

    this.textRef.nativeElement.innerHTML = '';
    this.textRef.nativeElement.appendChild(container);
  }

  createLinkElement(user: { name: string, uid: string; }) {
    let currentUser = this.getCurrentUserId();
    let a = document.createElement('a');
    a.textContent = `@${user.name}`;
    a.href = '#';
    a.addEventListener('click', (e) => {
      e.preventDefault();
      this.navbarService.findOrCreateDMchannel(user.uid, currentUser!)
    })

    return a
  }

  getUserList(text: string) {
    let userList = this.userMentionService.filteredUserList();
    let taggedUsers: { name: string, uid: string }[] = [];

    userList.forEach(user => {
      const isTagged = text.search(user.name);
      if (isTagged > 0) {
        taggedUsers.push({
          name: user.name,
          uid: user.uid
        })
      }

    })
    return taggedUsers
  }


  onEmojiMenuClosed() {
    this.emojiMenuOpen = false;
    this.showMenu = false;
  }

  selectEmoji(emoji: string) {
    this.emojiArray.emojiUsageHistory = [emoji, ...this.emojiUsageHistory.filter(e => e !== emoji)]
    this.addEmojiToTicket(emoji);

  }

  openEmojiMenu(trigger: MatMenuTrigger) {
    trigger.openMenu();
  }

  editText() {
  }

  isReaction() {

    if (this.message.reactions.length == 0) {
      return false;
    } else {
      return true
    }
  }


  get emojiList() {
    return this.emojiArray.emojiList
  }

  get emojiUsageHistory() {
    return this.emojiArray.emojiUsageHistory
  }


  get lastEmojis() {
    const emojis = [this.emojiUsageHistory[0], this.emojiUsageHistory[1]];
    return emojis
  }

  get sortedEmoji() {
    const historySet = new Set(this.emojiUsageHistory);
    const recentFirst = this.emojiUsageHistory.filter(e => this.emojiList.includes(e));
    const rest = this.emojiList.filter(e => !historySet.has(e));
    return [...recentFirst, ...rest]
  }



  showName() {
    const userIndex = this.findUser(this.message.senderId)

    if (userIndex >= 0 && this.members && this.isMember(userIndex, this.members)) {
      this.userName = this.members[userIndex]['name'];
      this.userImg = this.members[userIndex]['imgUrl'];
    } else {
      this.userName = "Guest";
      this.userImg = "assets/img/profile.png";
    }
  }


  async addEmojiToTicket(emoji: string) {
    let senderId = this.getCurrentUserId();
    let isEmoji: boolean = this.checkEmojiInArray(emoji);
    let isUserAddedReaction: boolean = this.checkUserReactions(senderId!);
    let reactionsCopy: { emoji: string; users: string[] }[] = [...this.message.reactions];
    let indexOfEmoji = this.getIndexOfEmoji(emoji);

    if (isEmoji && !isUserAddedReaction) {
      reactionsCopy[indexOfEmoji] = this.addUserIdToEmoji(senderId!, indexOfEmoji, emoji, reactionsCopy)
      this.updateReaction(reactionsCopy)
    } else if (!isEmoji) {
      this.addnewEmoji(reactionsCopy, emoji, senderId!)
      this.updateReaction(reactionsCopy)

    } else if (isEmoji && isUserAddedReaction) {
      this.deleteUserOrEmoji(reactionsCopy, indexOfEmoji, senderId!, emoji)
    }
  }

  deleteUserOrEmoji(reactionsCopy: { emoji: string; users: string[] }[], indexOfEmoji: number, senderId: string, emoji: string) {
    let users = reactionsCopy[indexOfEmoji].users
    let indexUser = reactionsCopy[indexOfEmoji].users.findIndex(user => user === senderId!)
    let newUserArray = users.splice(indexUser, 1)

    if (users.length === 0) {
      reactionsCopy.splice(indexOfEmoji, 1);
      this.updateReaction(reactionsCopy)
    } else {
      reactionsCopy[indexOfEmoji] = {
        emoji: emoji,
        users: newUserArray
      }
      this.updateReaction(reactionsCopy)
    }
  }

  addnewEmoji(reactionsCopy: { emoji: string; users: string[] }[], emoji: string, senderId: string) {
    reactionsCopy.push({
      emoji: emoji,
      users: [senderId!]
    })
  }

  addUserIdToEmoji(senderId: string, indexOfEmoji: number, emoji: string, reactionsCopy: { emoji: string; users: string[] }[]) {
    let usersCopy = [...this.message.reactions[indexOfEmoji].users]
    usersCopy.push(senderId!)

    return reactionsCopy[indexOfEmoji] = {
      emoji: emoji,
      users: usersCopy
    }
  }


  async updateReaction(reactionsCopy: { emoji: string; users: string[] }[]) {
    let threadMessageRef = this.getThreadMessageRef()
    try {
      await updateDoc(threadMessageRef, {
        reactions: reactionsCopy
      });
      this.message.reactions = reactionsCopy;
    } catch (err) {
      console.error("Failed to update reactions:", err);
    }
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
    return this.threadService.getThreadMesssageRef(this.message.threadMessageId!)

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

  getThreadFromRoute() {

  }

  getTicketRef() {
    let threadPath = this.message.threads?.path;
    let ticketPath = threadPath?.split('/').slice(0, 4).join('/')
    return doc(this.channelService.firestore, ticketPath!)
  }

  // async serachThreadMessage() {
  //   let threadColl = this.threadService.getThreadCollection();
  //   let threadMessages = await getDocs(threadColl);
  //   let messagesIds = []
  //   threadMessages.docs.forEach(message => [
  //     message.id
  //   ])
  //   console.log(threadMessages);

  // }

  showTime(): string {
    if (this.message?.createdAt instanceof Date) return this.message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (this.message?.createdAt instanceof Timestamp) return this.convertToDate(this.message.createdAt);
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
    return (this.getCurrentUserId() === this.message.senderId)

  }

  convertToDate(timestamp: Timestamp) {
    const rawCreatedAt = timestamp
    const createdAtDate = rawCreatedAt instanceof Timestamp ? rawCreatedAt.toDate() : null;
    if (createdAtDate) return createdAtDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    return "-"
  }




}


