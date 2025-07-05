import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMembersComponent } from './show-members.component';

describe('ShowMembersComponent', () => {
  let component: ShowMembersComponent;
  let fixture: ComponentFixture<ShowMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowMembersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShowMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
