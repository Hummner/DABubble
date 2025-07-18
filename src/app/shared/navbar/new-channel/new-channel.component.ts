import { Component, inject } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddChannelMemberComponent } from '../add-channel-member/add-channel-member.component';
import { NgClass } from '@angular/common';
import { NavbarInterface } from '../../../interfaces/navbar.interface';
import { addDoc, Firestore, collection, } from '@angular/fire/firestore';

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

  navbar: Partial<NavbarInterface> = {}
  channelName = '';
  channelDescription = '';

  form = new FormGroup({
    channelName: new FormControl('', Validators.required),
    channelDescription: new FormControl('')
  });

  private dialogRef = inject(MatDialogRef<NewChannelComponent>);
  constructor(
    private dialog: MatDialog,
    private firestore: Firestore) {}

  closeDialog() {
    this.dialogRef.close();
  }

  createChannel() {
    console.log(this.form.value);

    this.navbar.name = this.form.get('channelName')?.value as string;
    this.navbar.description = this.form.get('channelDescription')?.value as string;

    addDoc(collection(this.firestore, 'channels'), this.navbar)
      .then((docRef) => {
        console.log('Channel was successfully created!', docRef.id);
        this.navbar.channelId = docRef.id
        console.log("channelId", this.navbar.channelId);
        this.openAddMemberDialog(this.navbar.channelId);
        this.closeDialog();
      })
      .catch((error) => {
        console.error('Issue during channel creation', error);
    });
  }

  openAddMemberDialog(channelId: string) {
    this.dialog.open(AddChannelMemberComponent, {
      data: { channelName: this.navbar.name, channelDescription: this.navbar.description, channelId: channelId }
    }).afterClosed().subscribe(result => {
      console.log('AddMember－Result', this.form.value);
    });
    return channelId
  }
}