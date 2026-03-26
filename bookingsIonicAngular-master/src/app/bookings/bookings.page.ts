import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoadingController, ModalController, IonItemSliding } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { BookingService } from './booking.service';
import { Booking } from './booking.model';
import { BookingDetailsComponent } from './booking-details/booking-details.component';

@Component({
  selector: 'app-bookings',
  templateUrl: './bookings.page.html',
  styleUrls: ['./bookings.page.scss'],
})
export class BookingsPage implements OnInit, OnDestroy {

  loadedBookings: Booking[] = [];
  private bookingSub!: Subscription;

  isLoading = false;

  constructor(
    private bookingsService: BookingService,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.bookingSub = this.bookingsService.bookings.subscribe(bookings => {
      this.loadedBookings = bookings || [];
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;
    this.bookingsService.fetchBookings().subscribe({
      next: () => this.isLoading = false,
      error: (err) => {
        console.log('fetchBookings error', err);
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.bookingSub) this.bookingSub.unsubscribe();
  }

  trackByBookingId(index: number, item: Booking) {
    return item.id;
  }

  getImageUrl(path?: string) {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return 'http://localhost:8080' + path;
  }

  openBookingDetails(booking: Booking) {
    this.modalCtrl.create({
      component: BookingDetailsComponent,
      componentProps: { booking }
    }).then(m => m.present());
  }

  onCancelBooking(bookingId: string | number, slidingItem?: IonItemSliding) {
    this.loadingCtrl.create({ message: 'Canceling...' }).then(loadingEl => {
      loadingEl.present();

      if (slidingItem) slidingItem.close();

      this.bookingsService.cancelBooking(String(bookingId)).subscribe({
        next: () => loadingEl.dismiss(),
        error: (err) => {
          console.log('cancelBooking error', err);
          loadingEl.dismiss();
        }
      });
    });
  }
}
