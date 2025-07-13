import { Component, inject } from '@angular/core';
import { MatRadioModule} from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatDialogActions, MatDialog, MatDialogRef } from '@angular/material/dialog';
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

    constructor(public dialog: MatDialog ) { }

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
        console.log('addMember');
        this.closeDialog();
    }
}
