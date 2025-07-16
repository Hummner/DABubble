import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddChannelMemberComponent } from '../add-channel-member/add-channel-member.component';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-new-channel',
  standalone: true,
  templateUrl: './new-channel.component.html',
  styleUrl: './new-channel.component.scss',
  imports: [
    ReactiveFormsModule, 
    NgClass
  ]
})
export class NewChannelComponent {

  form = new FormGroup({
    channelName: new FormControl('', Validators.required),
    channelDescription: new FormControl('')
  });

  private dialogRef = inject(MatDialogRef<NewChannelComponent>);
  constructor(private dialog: MatDialog) {}

  closeDialog() {
    this.dialogRef.close();
  }

  setChannelDetails() {
    console.log(this.form.value);

    const channelName = this.form.get('channelName')?.value as string;
    const channelDescription = this.form.get('channelDescription')?.value as string;

    this.dialog.open(AddChannelMemberComponent, {
      data: { channelName, channelDescription }
    }).afterClosed().subscribe(result => {
      console.log('AddMember‑Result', this.form.value);
    });

    this.closeDialog();
  }
}