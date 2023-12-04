import { Component, OnDestroy, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { BookingService } from './booking.service';
import { Booking } from './booking.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit,OnDestroy {

  loadedBookings!: Booking[];
  private bookingSub!: Subscription;

  constructor(private bookingsService: BookingService) { }
  ngOnDestroy(): void {
    this.bookingSub.unsubscribe();
  }

  ngOnInit() {
    this.bookingSub = this.bookingsService.bookings.subscribe(bookings => {
      this.loadedBookings = bookings;
    })
  }

  onCancelBooking(offerID: string) {


  }
}
