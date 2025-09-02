import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Setup2FAComponent } from './2fa.component';

describe('Setup2FAComponent', () => {
  let component: Setup2FAComponent;
  let fixture: ComponentFixture<Setup2FAComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Setup2FAComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Setup2FAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
