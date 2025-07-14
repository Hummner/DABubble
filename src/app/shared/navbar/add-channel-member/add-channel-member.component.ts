import { Component, inject, Inject, Output } from '@angular/core';
import { MatRadioModule} from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatDialogActions, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgClass, NgIf } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatFormField } from "@angular/material/form-field";
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-add-channel-member',
  standalone: true,
  imports: [
    MatRadioModule, 
    FormsModule, 
    MatDialogActions, 
    NgClass, 
    MatIcon, 
    MatFormField, 
    NgIf, 
    MatInputModule
  ],
  templateUrl: './add-channel-member.component.html',
  styleUrl: './add-channel-member.component.scss'
})
export class AddChannelMemberComponent {

    constructor(
      public dialog: MatDialog, 
      @Inject(MAT_DIALOG_DATA) public data: any) {
        this.channelName = data.channelName || '';
      }
    
    channelName: string = '';
    inviteMode: number = 1;
    searchText: string = '';

    radioRef = inject(MatDialogRef<AddChannelMemberComponent>);
    closeDialog() {
        this.radioRef.close();
    }

    isDisabled(): boolean {
      return this.inviteMode === 2 && !this.searchText?.trim();
    }

    addMember() {
      this.radioRef.close({
        added: true,
        name: this.channelName
      });
    }

    ngOnInit() {
      console.log('Channelname aus vorherigem Dialog:', this.data.channelName);
    }
}
