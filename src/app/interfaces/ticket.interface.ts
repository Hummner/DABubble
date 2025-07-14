import { CollectionReference, DocumentData, Timestamp } from "@angular/fire/firestore";

export interface TicketInterface {
    createdAt: Timestamp,
    reactions: [],
    senderId: string,
    text: string,
    threadsCount: number,
    threads: CollectionReference<DocumentData>
}
