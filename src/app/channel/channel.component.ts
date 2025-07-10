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
  @ViewChild('discInput') discInput!: ElementRef<HTMLInputElement>;
  channelsService = inject(ChannelsService)
  showMenu = false;
  menuOpen = false;
  editName = false;
  editDisc = false;

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
}
