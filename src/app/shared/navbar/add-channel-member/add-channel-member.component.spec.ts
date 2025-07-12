import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddChannelMemberComponent } from './add-channel-member.component';

describe('AddChannelMemberComponent', () => {
  let component: AddChannelMemberComponent;
  let fixture: ComponentFixture<AddChannelMemberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddChannelMemberComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddChannelMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
