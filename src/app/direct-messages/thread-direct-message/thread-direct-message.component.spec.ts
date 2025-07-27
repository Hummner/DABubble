import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadDirectMessageComponent } from './thread-direct-message.component';

describe('ThreadDirectMessageComponent', () => {
  let component: ThreadDirectMessageComponent;
  let fixture: ComponentFixture<ThreadDirectMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadDirectMessageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ThreadDirectMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
