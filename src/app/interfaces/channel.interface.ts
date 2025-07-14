import { CollectionReference } from "@angular/fire/firestore";
import { TicketInterface } from "./ticket.interface";

export interface ChannelInterface {
    createdBy:string,
    description:string,
    members:any[],
    name:string,
    messages: TicketInterface[]

}