import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminCandyBar } from './admin-candy-bar';

describe('AdminCandyBar', () => {
  let component: AdminCandyBar;
  let fixture: ComponentFixture<AdminCandyBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCandyBar],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminCandyBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
