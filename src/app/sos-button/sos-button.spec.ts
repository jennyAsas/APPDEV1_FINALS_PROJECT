import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SosButton } from './sos-button';

describe('SosButton', () => {
  let component: SosButton;
  let fixture: ComponentFixture<SosButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SosButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SosButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
