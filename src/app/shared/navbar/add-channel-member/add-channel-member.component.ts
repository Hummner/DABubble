import { Component } from '@angular/core';
import { MatRadioModule} from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { MatDialogActions } from '@angular/material/dialog';
import { NgClass } from '@angular/common';


@Component({
  selector: 'app-add-channel-member',
  standalone: true,
  imports: [ MatRadioModule, FormsModule, MatDialogActions, NgClass ],
  templateUrl: './add-channel-member.component.html',
  styleUrl: './add-channel-member.component.scss'
})
export class AddChannelMemberComponent {

    constructor( ) { }

    addMember() {
        console.log('addMember');
    }
}
