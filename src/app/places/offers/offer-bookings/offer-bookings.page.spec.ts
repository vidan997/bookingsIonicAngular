import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { OfferBookingsPage } from './offer-bookings.page';

describe('OfferBookingsPage', () => {
  let component: OfferBookingsPage;
  let fixture: ComponentFixture<OfferBookingsPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(OfferBookingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
