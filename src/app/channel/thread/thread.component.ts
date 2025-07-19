import { Component, EventEmitter, inject, input, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TicketInterface } from '../../interfaces/ticket.interface';
import { Subscription } from 'rxjs';
import { ThreadService } from '../../services/thread.service';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent implements OnInit, OnDestroy {


  @Output() close = new EventEmitter<void>;
  @Input() tickets?: TicketInterface[];

  threadService = inject(ThreadService)
  private messagesSubscription?: Subscription
  messages: TicketInterface[] = []




  ngOnInit(): void {
    this.messagesSubscription = this.threadService.messagesSubscribe$.subscribe(msgArray => {
      this.messages = msgArray
    })

    this.renderMessages();
  }

  renderMessages() {

  }



  ngOnDestroy(): void {
    this.messagesSubscription?.unsubscribe();
    console.log("messagesSubctiption destroyed");
    
  }


}
