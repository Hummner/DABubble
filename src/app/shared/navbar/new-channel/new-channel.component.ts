import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddChannelMemberComponent } from '../add-channel-member/add-channel-member.component';
import { NgClass, NgIf } from '@angular/common';
import { NavbarInterface } from '../../../interfaces/navbar.interface';
import { addDoc, Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { Observable, timer } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-new-channel',
  standalone: true,
  templateUrl: './new-channel.component.html',
  styleUrl: './new-channel.component.scss',
  imports: [
    ReactiveFormsModule, 
    NgClass,
    NgIf
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
    private firestore: Firestore,
    private formbuilder: FormBuilder) {}

  ngOnInit() {
    this.form = this.formbuilder.group({
      channelName: ['', {
          validators: [Validators.required],
          asyncValidators: [this.channelNameExistsValidator()],
          updateOn: 'blur'
        }],
        channelDescription: ['']
      });
    }

  closeDialog() {
    this.dialogRef.close();
  }

  async createChannel() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.navbar.name = this.form.get('channelName')?.value as string;
    this.navbar.description = this.form.get('channelDescription')?.value as string;

    const channelNameExists = await this.checkIfChannelNameExists(this.navbar.name)

    if (channelNameExists) {
      this.form.get('channelName')?.setErrors({ 'exists': true });
      return;
    } else {
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
  }

  openAddMemberDialog(channelId: string) {
    this.dialog.open(AddChannelMemberComponent, {
      data: { channelName: this.navbar.name, channelDescription: this.navbar.description, channelId: channelId }
    }).afterClosed().subscribe(result => {
      console.log('AddMember－Result', this.form.value);
    });
    return channelId
  }

  async checkIfChannelNameExists(channelName: string) {
    const channelRef = collection(this.firestore, 'channels');
    const queryName = query(channelRef, where('name', '==', channelName)); 
    const querySnapshot = await getDocs(queryName);

    return !querySnapshot.empty;
  }

channelNameExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Promise<{ exists: boolean } | null> => {
      const name = control.value?.trim();

      if (!name) {
        return Promise.resolve(null);
      }
      
      const channelRef = collection(this.firestore, 'channels');
      const queryName = query(channelRef, where('name', '==', name));

      return getDocs(queryName).then(querySnapshot => {
        return querySnapshot.empty ? null : { exists: true };
      });
    };
  }
}