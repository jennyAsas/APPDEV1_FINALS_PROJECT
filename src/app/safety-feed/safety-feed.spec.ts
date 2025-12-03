import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SafetyFeed } from './safety-feed';

describe('SafetyFeed', () => {
  let component: SafetyFeed;
  let fixture: ComponentFixture<SafetyFeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SafetyFeed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SafetyFeed);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
