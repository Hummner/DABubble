import { inject, Injectable } from '@angular/core';
import { CollectionReference, doc, Firestore } from '@angular/fire/firestore';
import { collection, onSnapshot } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { ChannelInterface } from '../interfaces/channel.interface';
import { DocumentData } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChannelsService {
  private channelSubject = new BehaviorSubject<ChannelInterface | null>(null);
  firestore = inject(Firestore);
  channelURL!: string;
  unsubChannel?: () => void;
  // channelId = "KRIw2GN8Ym9EQmijM84l";
  channel$ = this.channelSubject.asObservable()

  constructor(private route: ActivatedRoute) {
  }

  getChannel(channelId: string) {
    this.unsubChannel = this.subChannel(channelId);

  }


  getChannelRef(channelId: string) {
    return doc(collection(this.firestore, "channels"), channelId)
  }

  getChannelInfos(channelData?: DocumentData, channelId?: string) {
    if (channelData && channelId) {
      const channel: ChannelInterface = {
        createdBy: channelData['createdBy'],
        description: channelData['description'],
        members: channelData['members'],
        name: channelData['name'],
        messages: this.getMessages(channelId)
      };

      this.channelSubject.next(channel);
    }
  }

  getMessages(channelId: string) {
    return collection(this.getChannelRef(channelId), "messages")
  }



  subChannel(channelId: string) {
    return onSnapshot(this.getChannelRef(channelId), (el) => {
      let channelData = el.data();
      console.log(channelData);
      this.getChannelInfos(channelData, channelId);
    })

  }
}
