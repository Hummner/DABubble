import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AddChannelMemberComponent } from '../add-channel-member/add-channel-member.component';
import { NgClass, NgIf } from '@angular/common';
import { NavbarInterface } from '../../../interfaces/navbar.interface';
import { addDoc, Firestore, collection, query, where, getDocs, updateDoc } from '@angular/fire/firestore';
import { FirestoreService } from '../../../services/firestore.service';
import { NavbarService } from '../../../services/navbar.service';
import { ActivatedRoute, Router } from '@angular/router';

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
  userProfile = this.firestoreService.userProfile;
  navbar: Partial<NavbarInterface> = {}
  navbarService = inject(NavbarService);
  channelName = '';
  channelDescription = '';

  form = new FormGroup({
    channelName: new FormControl('', Validators.required),
    channelDescription: new FormControl('')
  });

  private dialogRef = inject(MatDialogRef<NewChannelComponent>);
  constructor(
    private dialog: MatDialog,
    private firestoreService: FirestoreService,
    private firestore: Firestore,
    private formbuilder: FormBuilder,
    private router: Router,) {}
    

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
    if (!this.IsFormValid()) return;
    this.navbar.name = this.form.get('channelName')?.value as string;
    this.navbar.description = this.form.get('channelDescription')?.value as string;
    
    const nameExists = await this.checkIfChannelNameExists(this.navbar.name);
    if (nameExists) {
      return this.handleExistingName();
    }
    await this.addChannelToFirestore();
  }

  private IsFormValid(): boolean {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return false;
    }
    return true;
  }

  private handleExistingName(): void {
    this.form.get('channelName')?.setErrors({ 'exists': true });
  }

  private async addChannelToFirestore(): Promise<void> {
    this.navbar.members = [];
    this.navbar = this.addCreatorToChannel();
    const docRef = await addDoc(collection(this.firestore, 'channels'), {
      ...this.navbar,
      members: this.navbar.members,
    });

    let newChannelID = await this.updateChannelIDToFirestore(docRef);
    this.openAddMemberDialog(newChannelID || '', this.navbar.members || []);
    this.closeDialog();
  }

  async updateChannelIDToFirestore(docRef: any) {
    this.navbar.channelId = docRef.id;
      await updateDoc(docRef, { 
        channelId: docRef.id 
      });
      return this.navbar.channelId
  }

  addCreatorToChannel(){
    this.navbar.members?.push({
      id: this.userProfile()?.uid || '',
      role: 'admin',
      name: this.userProfile()?.name || '',
      imgUrl: this.userProfile()?.imgUrl || ''
    });
    return this.navbar
  }

  openAddMemberDialog(channelId: string, members: any[]) {
    this.dialog.open(AddChannelMemberComponent, {
      data: { channelName: this.navbar.name, channelDescription: this.navbar.description, channelId: channelId, members: members }
    }).afterClosed().subscribe(result => {});
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

  navigateToChannelAfterCreation() {
    this.closeDialog();
    setTimeout(() => {
      this.navbarService.selectChannel(this.navbar.channelId || '');
      this.router.navigateByUrl('/channel/' + this.navbar.channelId || '');
    }, 1000);
  }
}