import { CollectionReference, DocumentData, FieldValue, Timestamp } from "@angular/fire/firestore";

export interface TicketInterface {
    createdAt: FieldValue | Date | null,
    reactions: { emoji: string; users: string[] }[];
    senderId: string,
    text: string,
    threadsCount?: number,
    threads?: CollectionReference<DocumentData>
}
