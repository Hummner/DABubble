import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarSelectionComponent } from './avatar-selection.component';

describe('AvatarSelectionComponent', () => {
  let component: AvatarSelectionComponent;
  let fixture: ComponentFixture<AvatarSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarSelectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AvatarSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
