import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogMessageComponent } from './log-message.component';

describe('LogMessageComponent', () => {
  let component: LogMessageComponent;
  let fixture: ComponentFixture<LogMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogMessageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LogMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
