import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Firestore } from '@angular/fire/firestore';
import { collection, onSnapshot } from 'firebase/firestore';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'dabubble';
  firestore!: Firestore;
  firebaseServer?: () => void;

  constructor() {

    this.firestore = inject(Firestore);
    console.log(this.firestore);
    
    // const testColl = collection(this.firestore, 'Test');


  //       this.unsubList = onSnapshot(this.getUserRef(), (list) => {
  //     this.users = [];
  //     list.forEach((element) => {
  //       this.users.push(this.setUserObject(element.data(), element.id));
  //       console.log(this.users);
  //     });
  //   });
  // }

  }

  ngOnInit(): void {
    this.testFire();
  }

  testFire() {
    this.firebaseServer = onSnapshot(collection(this.firestore, 'Test'), (e) => {
      e.forEach(el => console.log(el.data()))
      
    })
  }

  ngOnDestroy() {
    this.firebaseServer;
  }





}
