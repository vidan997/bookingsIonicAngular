import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Booking } from '../booking.model';

@Component({
  selector: 'app-booking-details',
  templateUrl: './booking-details.component.html',
  styleUrls: ['./booking-details.component.scss'],
})
export class BookingDetailsComponent {

  @Input() booking!: Booking;

  private readonly BASE_URL = 'http://localhost:8080/uploads';

  constructor(private modalCtrl: ModalController) { }

  close(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  getImageUrl(path?: string | null): string {
    if (!path) return '';

    if (
      path.startsWith('http://') ||
      path.startsWith('https://') ||
      path.startsWith('data:')
    ) {
      return path;
    }

    const fileName = path.startsWith('/') ? path.substring(1) : path;

    return `${this.BASE_URL}/${fileName}`;
  }
  
  getNights(): number {
    if (!this.booking?.bookedFrom || !this.booking?.bookedTo) {
      return 0;
    }

    const from = new Date(this.booking.bookedFrom);
    const to = new Date(this.booking.bookedTo);

    const diffTime = to.getTime() - from.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return nights > 0 ? nights : 0;
  }

  getPricePerNight(): number {
    return Number(this.booking?.priceAtBooking || 0);
  }

  getTotalPrice(): number {
    return this.getNights() * this.getPricePerNight();
  }
}