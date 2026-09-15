import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sala } from './sala';

describe('Sala', () => {
  let component: Sala;
  let fixture: ComponentFixture<Sala>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sala],
    }).compileComponents();

    fixture = TestBed.createComponent(Sala);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
