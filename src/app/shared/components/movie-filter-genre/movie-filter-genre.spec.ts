import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovieFilterGenre } from './movie-filter-genre';

describe('MovieFilterGenre', () => {
  let component: MovieFilterGenre;
  let fixture: ComponentFixture<MovieFilterGenre>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieFilterGenre],
    }).compileComponents();

    fixture = TestBed.createComponent(MovieFilterGenre);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
