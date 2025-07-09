import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogActions } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-new-channel',
  standalone: true,
  templateUrl: './new-channel.component.html',
  styleUrl: './new-channel.component.scss',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogActions,
    MatDialogModule,
    NgClass,
  ],
})
export class NewChannelComponent {
  channelName = '';
  dialogRef = inject(MatDialogRef<NewChannelComponent>);

  closeDialog() {
    this.dialogRef.close();
  }

  createChannel() {
    if (this.channelName.trim()) {
      this.dialogRef.close(this.channelName);
    }
  }
}
