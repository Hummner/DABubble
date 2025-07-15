import { CollectionReference, DocumentData, FieldValue, Timestamp } from "@angular/fire/firestore";

export interface TicketInterface {
    createdAt: Timestamp | FieldValue,
    reactions: [],
    senderId: string,
    text: string,
    threadsCount: number,
    threads?: CollectionReference<DocumentData>
}
