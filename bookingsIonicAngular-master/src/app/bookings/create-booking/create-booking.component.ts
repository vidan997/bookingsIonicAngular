import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Place } from 'src/app/places/place.model';
import { BookingService } from '../booking.service';
import { Booking } from '../booking.model';
import { take } from 'rxjs';

type DtValue = string | string[] | null | undefined;

@Component({
  selector: 'app-create-booking',
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.scss'],
})
export class CreateBookingComponent implements OnInit {

  @Input() selectedPlace!: Place;
  @ViewChild('f', { static: true }) form!: NgForm;

  minDate!: string;
  maxDate!: string;

  bookedFrom!: string;
  bookedTo!: string;

  bookedRanges: { from: Date; to: Date }[] = [];
  selectedRoomId: number | null = null;

  isDateEnabled = (isoString: string) => {
    const d = new Date(isoString);
    d.setHours(0, 0, 0, 0);

    const min = new Date(this.minDate);
    min.setHours(0, 0, 0, 0);

    const max = new Date(this.maxDate);
    max.setHours(0, 0, 0, 0);

    if (d < min || d > max) return false;

    for (const r of this.bookedRanges) {
      const from = new Date(r.from);
      from.setHours(0, 0, 0, 0);

      const to = new Date(r.to);
      to.setHours(0, 0, 0, 0);

      if (d >= from && d < to) return false;
    }

    return true;
  };

  constructor(
    private modalCtrl: ModalController,
    private bookingService: BookingService
  ) {}

  ngOnInit() {
    const minArr = this.selectedPlace?.avaiableFrom?.toISOString().split('T')!;
    this.minDate = minArr[0];

    const maxArr = this.selectedPlace?.avaiableTo?.toISOString().split('T')!;
    this.maxDate = maxArr[0];

    this.bookedFrom = this.minDate;
    this.bookedTo = this.minDate;

    this.bookingService.fetchBookingsForPlace(String(this.selectedPlace.id)).pipe(take(1)).subscribe({
      next: (bookings: Booking[]) => {
        this.bookedRanges = bookings.map(b => ({
          from: new Date(b.bookedFrom),
          to: new Date(b.bookedTo)
        }));
      },
      error: () => {
        this.bookedRanges = [];
      }
    });
  }

  onCancel() {
    this.modalCtrl.dismiss();
  }

  private normalizeDtValue(v: DtValue): string | null {
    if (!v) return null;
    if (Array.isArray(v)) return v[0] ?? null;
    return v;
  }

  onFromChanged(v: DtValue) {
    const value = this.normalizeDtValue(v);
    if (!value) return;

    this.bookedFrom = value;

    if (this.bookedTo) {
      const from = new Date(this.bookedFrom);
      const to = new Date(this.bookedTo);
      if (!(to > from)) {
        this.bookedTo = this.bookedFrom;
      }
    }
  }

  onToChanged(v: DtValue) {
    const value = this.normalizeDtValue(v);
    if (!value) return;

    this.bookedTo = value;
  }

  datesValid() {
    if (!this.bookedFrom || !this.bookedTo) return false;

    const from = new Date(this.bookedFrom);
    const to = new Date(this.bookedTo);
    if (!(to > from)) return false;

    for (const r of this.bookedRanges) {
      const rf = new Date(r.from);
      const rt = new Date(r.to);
      if (from < rt && to > rf) return false;
    }

    return true;
  }

  getSelectedRoom() {
    if (!this.selectedPlace?.rooms || this.selectedPlace.rooms.length === 0) {
      return null;
    }

    return this.selectedPlace.rooms.find(
      room => Number(room.id) === Number(this.selectedRoomId)
    ) || null;
  }

  onBookPlace() {
    if (!this.form.valid) return;
    if (!this.datesValid()) return;

    const selectedRoom = this.getSelectedRoom();
    if (!selectedRoom) return;

    this.modalCtrl.dismiss({
      bookingData: {
        firstName: this.form.value['first-name'],
        lastName: this.form.value['last-name'],
        roomid: selectedRoom.id,
        roomType: selectedRoom.roomType,
        priceAtBooking: selectedRoom.price,
        bookedFrom: new Date(this.bookedFrom),
        bookedTo: new Date(this.bookedTo)
      }
    }, 'confirm');
  }
}