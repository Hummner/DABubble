import { inject, Injectable } from '@angular/core';
import { collection, doc, onSnapshot } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class ThreadService {
  firestore = inject(Firestore);
  unsubMessages?: () => void;



  constructor() { }


  
  getThreadsFromTicket(threadPath: string) {
    debugger
    let getThreadRef =  collection(this.firestore, threadPath);
    console.log(getThreadRef);
    
    this.unsubMessages = onSnapshot(getThreadRef, (msgList) => {
      msgList.forEach(msg => {
        console.log(msg.data());
        
        
      })
    })
  }


}
