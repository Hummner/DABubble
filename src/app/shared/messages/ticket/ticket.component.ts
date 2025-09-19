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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { EmojiArrayService } from '../../../services/emoji-array.service';
import { UserMentionService } from '../../../services/user-channel-mention.service';
import { DirectMessageService } from '../../../services/direct-message.service';
import { NavbarService } from '../../../services/navbar.service';

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

  userMentionService = inject(UserMentionService);
  directMsgService = inject(DirectMessageService);
  navbarService = inject(NavbarService);

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

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {


    if (this.ticket.threads) {
      this.getMessageId();
      let ticketPath = this.ticket.threads.path.split('/').slice(3, 4).join('/')

      if (this.messageId === ticketPath) {
        console.log("This ticket: ", this.messageId);
        console.log("This path:", ticketPath);
        this.openThreadPanel()
      }
    }


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
      this.lastThreadTime = this.showLastThreadTime()



    }



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
    this.showMenu = true
    console.log("Emojimenuopend");

  }


  onEmojiMenuClosed() {
    this.emojiMenuOpen = false;
    this.showMenu = false;
  }

  openEditView() {
    this.editView = true;
    this.editedText = this.ticket.text;
  }


  editText() {
    this.channelService.editTicketText(this.getTicketRef(), this.editedText).then(() => {
      this.ticket.text = this.editedText
      this.editView = false;
    })


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
    name = this.renderPopUpText(isCurrentUserReacted, nameArray, allUserCount)
    return name
  }

  renderPopUpText(isCurrentUserReacted: boolean, nameArray: string[], allUserCount: number) {
    let name = "Guest"
    if (isCurrentUserReacted && nameArray.length == 1) {
      let lastName = nameArray[nameArray.length - 1];
      name = `${lastName} und Du`;
    } else if (isCurrentUserReacted && nameArray.length > 1) {
      name = `Du und +${allUserCount}`
    } else if (isCurrentUserReacted && nameArray.length == 0 && allUserCount == 0) {
      name = "Du"
    }
    else if (!isCurrentUserReacted && nameArray.length == 1) {
      name = nameArray[0];
    } else if (!isCurrentUserReacted && nameArray.length > 1) {
      let firsName = nameArray[0];
      name = `${firsName} und +${allUserCount}`
    } else if (allUserCount > 0) {
      name = `Guest und +${allUserCount}`
    }
    return name
  }

  openThreadPanel() {
    if (this.ticket.threads?.path) {
      this.getThreadPath(this.ticket.threads?.path)
      console.log(this.ticket.threads.path);

      this.threadsService.getThreadsFromTicket(this.ticket.threads?.path, this.ticket);
      this.threadsService.getCurrentTicket()
      this.openThread.emit()
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

  selectEmoji(emoji: string) {
    this.emojiArray.emojiUsageHistory = [emoji, ...this.emojiUsageHistory.filter(e => e !== emoji)]
    this.addEmojiToTicket(emoji);

  }

  openEmojiMenu(trigger: MatMenuTrigger) {
    trigger.openMenu();
  }

  async addEmojiToTicket(emoji: string) {
    let senderId = this.getCurrentUserId();
    let isEmoji: boolean = this.checkEmojiInArray(emoji);
    let isUserAddedReaction: boolean = this.checkUserReactions(senderId!);
    let reactionsCopy: { emoji: string; users: string[] }[] = [...this.ticket.reactions];
    let indexOfEmoji = this.getIndexOfEmoji(emoji)

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
    let usersCopy = [...this.ticket.reactions[indexOfEmoji].users]
    usersCopy.push(senderId!)

    return reactionsCopy[indexOfEmoji] = {
      emoji: emoji,
      users: usersCopy
    }
  }


  async updateReaction(reactionsCopy: { emoji: string; users: string[] }[]) {
    let ticketRef = this.getTicketRef();
    try {
      await updateDoc(ticketRef, {
        reactions: reactionsCopy
      });
      this.ticket.reactions = reactionsCopy;
    } catch (err) {
      console.error("Failed to update reactions:", err);

    }
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
    const userIndex = this.findUser(this.ticket.senderId);

    if (userIndex >= 0 && this.members && this.isMember(userIndex, this.members)) {
      this.userName = this.members[userIndex]['name'];
      this.userImg = this.members[userIndex]['imgUrl'];
    } else {
      this.userName = "Guest";
      this.userImg = "assets/img/profile.png"
    }
  }


  showTime(): string {
    return this.ticket?.createdAt instanceof Date ? this.ticket.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
  }

  showLastThreadTime() {
    return this.ticket?.lastThread instanceof Date ? this.ticket.lastThread.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'
  }



  showText() {


    let container = document.createElement('p');
    container.classList.add('text-link')

    //   if (this.ticket.text.includes('#')) {
    //   this.tagHastagInText(container)
    // }


    let lastIndex = 0;

    let text = this.ticket.text;
    let taggedUsers = this.getUserList(text);
    let taggedChannels = this.getChannelList(text)
    let taggedArray = taggedUsers.concat(taggedChannels);

    taggedArray.sort((a, b) => a.textIndex - b.textIndex)

    console.log(taggedArray);

    // ########################

    if (taggedArray.length > 0) {
          taggedArray.forEach(tag => {
      if (tag.taggedType == "channel") {
        lastIndex = this.changeTextToChannelLink(tag, container, lastIndex, text);
        this.createTextAfterLink(lastIndex, tag.name, container);
        return
      }
      
      if (tag.taggedType == "user") {
        lastIndex = this.changeTextToUserLink(tag, container, lastIndex, text);
        this.createTextAfterLink(lastIndex, tag.name, container);
        return
      }



    })

    } else {
      this.createText(container, text);
    }







    // taggedUsers.forEach(user => {
    //   let tag = `@${user.name}`
    //   let idx = text.indexOf(tag, lastIndex)

    //   if (idx !== -1) {
    //     const before = text.substring(lastIndex, idx);
    //     if (before) container.appendChild(document.createTextNode(before))
    //     const a = this.createLinkElement(user)
    //     container.appendChild(a);
    //     lastIndex = idx + tag.length
    //   }
    //   this.createTextAfterLink(lastIndex, text, container);
    // })
    // if (taggedUsers.length == 0 && taggedChannels.length == 0) return this.createText(container, text);
    // return
  }

  changeTextToChannelLink(tag: { name: string, id: string, textIndex: number, taggedType: string }, container: any, lastIndex: number, text: any) {
    let symbol = `#${tag.name}`;
    let idx = text.indexOf(symbol, lastIndex);

    const before = text.substring(lastIndex, idx);
    if (before) container.appendChild(document.createTextNode(before));
    const a = this.createLinkElement(tag);
    container.appendChild(a);
    return lastIndex = idx + symbol.length
  }

  changeTextToUserLink(tag: { name: string, id: string, textIndex: number, taggedType: string }, container: any, lastIndex: number, text: any) {
    let symbol = `@${tag.name}`;
    let idx = text.indexOf(symbol, lastIndex);

    const before = text.substring(lastIndex, idx);
    if (before) container.appendChild(document.createTextNode(before));
    const a = this.createLinkElement(tag);
    container.appendChild(a);
    lastIndex = idx + symbol.length
    return lastIndex
  }

  // tagHastagInText(container: any) {

  //   let text = this.ticket.text;
  //   let taggedChannels = this.getChannelList(text)

  //   let lastIndex = 0;


  //   taggedChannels.forEach(channel => {
  //     let tag = `#${channel.name}`;
  //     let idx = text.indexOf(tag, lastIndex)

  //     if (idx !== -1) {
  //       const before = text.substring(lastIndex, idx);
  //       if (before) container.appendChild(document.createTextNode(before))
  //       const a = this.createLinkElementHastag(channel)
  //       container.appendChild(a);
  //       lastIndex = idx + tag.length
  //     }
  //     this.createTextAfterLink(lastIndex, text, container);
  //   })

  // }

  createLinkElement(tag: { name: string, id: string, textIndex: number, taggedType: string }) {
    let a = document.createElement('a');

    if (tag.taggedType == "channel") {
      a = this.linkWithHastag(tag, a)
    }

    if (tag.taggedType == "user") {
      a = this.linkWithAt(tag, a)
    }

    return a
  }

  linkWithHastag(tag: { name: string, id: string, textIndex: number, taggedType: string }, a: HTMLAnchorElement) {
    a.textContent = `#${tag.name}`;
    a.href = '#';
    a.addEventListener('click', (e) => {
      e.preventDefault();
      this.userMentionService.findChannel(tag.id)
    })
    return a
  }

  linkWithAt(tag: { name: string, id: string, textIndex: number, taggedType: string }, a: HTMLAnchorElement) {
    let currentUser = this.getCurrentUserId();
    a.textContent = `@${tag.name}`;
    a.href = '#';
    a.addEventListener('click', (e) => {
      e.preventDefault();
      this.navbarService.findOrCreateDMchannel(tag.id, currentUser!)
    })
    return a
  }


  getChannelList(text: string) {
    let channelList = this.userMentionService.getChannelWithUserMemmership();
    let taggedChannels: { name: string, id: string, textIndex: number, taggedType: string }[] = [];


    channelList.forEach(channel => {
      const isTagged = text.search(channel.name)
      if (isTagged > 0) {
        let taggedText = `#${channel.name}`
        let textIndex = text.indexOf(taggedText)
        taggedChannels.push({
          name: channel.name,
          id: channel.channelId,
          textIndex: textIndex,
          taggedType: "channel"
        })
      }
    })
    return taggedChannels

  }

  createText(container: HTMLParagraphElement, text: string) {
    container.innerHTML = text.trim();
    this.textRef.nativeElement.appendChild(container);
  }

  createTextAfterLink(lastIndex: number, text: string, container: HTMLParagraphElement) {
    if (lastIndex < text.length) {
      container.appendChild(document.createTextNode(text.substring(lastIndex)))
    }
    this.textRef.nativeElement.innerHTML = "";
    this.textRef.nativeElement.appendChild(container);
  }

  // createLinkElement(user: { name: string, id: string; }) {
  //   let currentUser = this.getCurrentUserId();
  //   let a = document.createElement('a');
  //   a.textContent = `@${user.name}`;
  //   a.href = '#';
  //   a.addEventListener('click', (e) => {
  //     e.preventDefault();
  //     this.navbarService.findOrCreateDMchannel(user.id, currentUser!)
  //   })

  //   return a
  // }

  getUserList(text: string) {
    let userList = this.userMentionService.filteredUserList();
    let taggedUsers: { name: string, id: string, textIndex: number, taggedType: string }[] = [];

    userList.forEach(user => {
      const isTagged = text.search(user.name);
      if (isTagged > 0) {
        let taggedText = `@${user.name}`
        let textIndex = text.indexOf(taggedText)
        taggedUsers.push({
          name: user.name,
          id: user.uid,
          textIndex: textIndex,
          taggedType: "user"
        })
      }

    })
    return taggedUsers
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
