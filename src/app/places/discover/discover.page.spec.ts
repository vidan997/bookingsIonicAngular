import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { DiscoverPage } from './discover.page';

describe('DiscoverPage', () => {
  let component: DiscoverPage;
  let fixture: ComponentFixture<DiscoverPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(DiscoverPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
