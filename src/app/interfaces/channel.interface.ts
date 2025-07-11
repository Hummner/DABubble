import { CollectionReference } from "@angular/fire/firestore";

export interface ChannelInterface {
    createdBy:string,
    description:string,
    members:[],
    name:string,
    messages: CollectionReference

}