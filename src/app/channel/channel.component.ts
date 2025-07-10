import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ThreadComponent } from './thread/thread.component';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { TicketComponent } from '../shared/messages/ticket/ticket.component';
import { ChannelsService } from '../services/channels.service';
import { collection } from 'firebase/firestore';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [MatIconModule, MatSidenavModule, ThreadComponent, MatMenuModule, CommonModule, TicketComponent],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss',
})
export class ChannelComponent {

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;
  channelsService = inject(ChannelsService)
  showMenu = false;
  menuOpen = false;
  editName = false;
  editDescription = false

  openMenu(trigger: MatMenuTrigger) {
    trigger.openMenu();
    this.menuOpen = true;
  }

    closeMenu(trigger: MatMenuTrigger) {
    trigger.closeMenu();
  }

  editChannelName() {
    this.editName = true;
    this.nameInput.nativeElement.focus();
    this.focusAfterText()

  }

  focusAfterText() {
    let input = this.nameInput.nativeElement;
    let length = input.value.length;
    input.setSelectionRange(length, length);

  }


}
