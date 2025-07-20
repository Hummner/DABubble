import { CollectionReference, DocumentData, FieldValue, Timestamp } from "@angular/fire/firestore";

export interface TicketInterface {
    createdAt: FieldValue | Date | null,
    reactions: [],
    senderId: string,
    text: string,
    threadsCount?: number,
    threads?: CollectionReference<DocumentData>
}
