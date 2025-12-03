import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertForm } from './alert-form';

describe('AlertForm', () => {
  let component: AlertForm;
  let fixture: ComponentFixture<AlertForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
