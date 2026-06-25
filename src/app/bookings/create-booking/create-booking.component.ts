import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { take } from 'rxjs';

import { Place } from 'src/app/places/place.model';
import { BookingService } from '../booking.service';
import { Booking } from '../booking.model';

declare var paypal: any;

type PriceLevel = 'low' | 'mid' | 'high' | null;

interface CalendarDay {
  date: Date | null;
  iso: string | null;
  dayNumber: number | null;
  inCurrentMonth: boolean;
  disabled: boolean;
  booked: boolean;
  price: number | null;
  priceLevel: PriceLevel;
  inRange: boolean;
  isStart: boolean;
  isEnd: boolean;
}

@Component({
  selector: 'app-create-booking',
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.scss'],
})
export class CreateBookingComponent implements OnInit {
  @Input() selectedPlace!: Place;
  @Input() selectedRoomType!: string;

  @ViewChild('f', { static: true }) form!: NgForm;

  minDate = '';
  maxDate = '';

  bookedFrom = '';
  bookedTo = '';

  bookedRanges: { roomId: number; from: Date; to: Date }[] = [];

  showPayPal = false;
  paypalOrderId: string | null = null;
  paypalAmountEur: number | null = null;
  isPayPalLoading = false;

  selectedResolvedRoomId: number | null = null;

  currentMonthDate: Date = new Date();
  monthLabel = '';
  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  calendarDays: CalendarDay[] = [];

  constructor(
    private modalCtrl: ModalController,
    private bookingService: BookingService
  ) {}

  ngOnInit() {
    this.minDate = this.dateToIso(new Date());

    const placeAvailableTo = this.selectedPlace?.avaiableTo
      ? new Date(this.selectedPlace.avaiableTo)
      : new Date();

    this.maxDate = this.dateToIso(placeAvailableTo);

    this.bookingService.fetchBookingsForPlace(String(this.selectedPlace.id)).pipe(take(1)).subscribe({
      next: (bookings: Booking[]) => {
        this.bookedRanges = bookings.map(b => ({
          roomId: Number((b as any).roomId ?? (b as any).roomid),
          from: new Date(b.bookedFrom),
          to: new Date(b.bookedTo)
        }));
        this.buildCalendar();
      },
      error: () => {
        this.bookedRanges = [];
        this.buildCalendar();
      }
    });
  }

  onCancel() {
    this.modalCtrl.dismiss();
  }

  private resetPayPalState() {
    this.showPayPal = false;
    this.paypalOrderId = null;
    this.paypalAmountEur = null;
    this.selectedResolvedRoomId = null;
  }

  getRoomsForSelectedType() {
    if (!this.selectedPlace?.rooms || !this.selectedRoomType) {
      return [];
    }
  
    return this.selectedPlace.rooms.filter(
      (room: any) =>
        String(room.roomType).toLowerCase().trim() ===
        String(this.selectedRoomType).toLowerCase().trim()
    );
  }

  getSelectedTypeLowestPrice(): number | null {
    const rooms = this.getRoomsForSelectedType();
    const prices: number[] = [];
  
    rooms.forEach((room: any) => {
      if (room.seasonPrices?.length) {
        room.seasonPrices.forEach((sp: any) => {
          const p = Number(sp.pricePerNight);
          if (!isNaN(p) && p > 0) {
            prices.push(p);
          }
        });
      }
    });
  
    return prices.length ? Math.min(...prices) : null;
  }

  isDateEnabled = (isoString: string) => {
    const d = this.isoToDateOnly(isoString);

    const min = this.isoToDateOnly(this.minDate);
    const max = this.isoToDateOnly(this.maxDate);

    if (d < min || d > max) return false;

    const rooms = this.getRoomsForSelectedType();
    if (rooms.length === 0) return false;

    return rooms.some((room: any) => !this.isRoomBookedOnDate(Number(room.id), d));
  };

  datesValid(): boolean {
    if (!this.bookedFrom || !this.bookedTo) return false;

    const from = this.isoToDateOnly(this.bookedFrom);
    const to = this.isoToDateOnly(this.bookedTo);

    if (!(to > from)) return false;

    return !!this.findAvailableRoomForRange(this.bookedFrom, this.bookedTo);
  }

  onDayClick(day: CalendarDay) {
    if (!day.date || !day.iso || day.disabled) return;

    if (!this.bookedFrom || this.bookedTo) {
      this.bookedFrom = day.iso;
      this.bookedTo = '';
      this.resetPayPalState();
      this.buildCalendar();
      return;
    }

    const fromDate = this.isoToDateOnly(this.bookedFrom);
    const clickedDate = this.isoToDateOnly(day.iso);

    if (clickedDate <= fromDate) {
      this.bookedFrom = day.iso;
      this.bookedTo = '';
      this.resetPayPalState();
      this.buildCalendar();
      return;
    }

    if (this.rangeHasUnavailableDays(fromDate, clickedDate)) {
      this.bookedFrom = day.iso;
      this.bookedTo = '';
      this.resetPayPalState();
      this.buildCalendar();
      return;
    }

    this.bookedTo = day.iso;
    this.resetPayPalState();
    this.buildCalendar();
  }

  getNumberOfNights(): number {
    if (!this.bookedFrom || !this.bookedTo) return 0;

    const from = this.isoToDateOnly(this.bookedFrom);
    const to = this.isoToDateOnly(this.bookedTo);

    const diff = to.getTime() - from.getTime();
    if (diff <= 0) return 0;

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getEstimatedTotalRsd(): number {
    if (!this.datesValid()) return 0;

    const room = this.findAvailableRoomForRange(this.bookedFrom, this.bookedTo);
    if (!room) return 0;

    let total = 0;
    const from = this.isoToDateOnly(this.bookedFrom);
    const to = this.isoToDateOnly(this.bookedTo);
    const current = new Date(from);

    while (current < to) {
      const price = this.getPriceForRoomAndDate(room, current);
      total += price ?? 0;
      current.setDate(current.getDate() + 1);
    }

    return total;
  }

  onStartPayment() {
    if (!this.form.valid) return;
    if (!this.datesValid()) return;

    const resolvedRoom = this.findAvailableRoomForRange(this.bookedFrom, this.bookedTo);
    if (!resolvedRoom) {
      alert('No room of this type is available for the selected dates.');
      return;
    }

    this.selectedResolvedRoomId = Number((resolvedRoom as any).id);

    this.isPayPalLoading = true;
    this.showPayPal = false;
    this.paypalOrderId = null;

    this.bookingService.createPayPalOrder(
      Number(this.selectedPlace.id),
      Number((resolvedRoom as any).id),
      new Date(this.bookedFrom),
      new Date(this.bookedTo)
    ).subscribe({
      next: (res) => {
        this.paypalOrderId = res.orderId;
        this.paypalAmountEur = res.amountEur;
        this.showPayPal = true;
        this.isPayPalLoading = false;

        setTimeout(() => {
          this.loadPayPal();
        }, 100);
      },
      error: (err) => {
        this.isPayPalLoading = false;
        console.error('CREATE ORDER ERROR', err);
        alert(typeof err?.error === 'string' ? err.error : 'Could not create PayPal order');
      }
    });
  }

  loadPayPal() {
    if (!paypal) {
      console.error('PayPal nije ucitan!');
      return;
    }

    if (!this.paypalOrderId) {
      console.error('PayPal order id missing!');
      return;
    }

    const container = document.getElementById('paypal-button-container');
    if (container) {
      container.innerHTML = '';
    }

    paypal.Buttons({
      createOrder: (_data: any, _actions: any) => {
        return this.paypalOrderId;
      },

      onApprove: async (data: any, _actions: any) => {
        this.bookingService.capturePayPalOrder(
          data.orderID,
          this.form.value['first-name'],
          this.form.value['last-name']
        ).subscribe({
          next: (res) => {
            this.modalCtrl.dismiss(res, 'confirm');
          },
          error: (err) => {
            console.error('CAPTURE ERROR', err);
            alert(typeof err?.error === 'string' ? err.error : 'Payment captured but booking failed');
          }
        });
      },

      onCancel: () => {
        console.log('CANCEL');
      },

      onError: (err: any) => {
        console.error('PAYPAL ERROR', err);
      }
    }).render('#paypal-button-container');
  }

  prevMonth() {
    this.currentMonthDate = new Date(
      this.currentMonthDate.getFullYear(),
      this.currentMonthDate.getMonth() - 1,
      1
    );
    this.buildCalendar();
  }

  nextMonth() {
    this.currentMonthDate = new Date(
      this.currentMonthDate.getFullYear(),
      this.currentMonthDate.getMonth() + 1,
      1
    );
    this.buildCalendar();
  }

  buildCalendar() {
    const year = this.currentMonthDate.getFullYear();
    const month = this.currentMonthDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = (firstDay.getDay() + 6) % 7;

    this.monthLabel = firstDay.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const days: CalendarDay[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({
        date: null,
        iso: null,
        dayNumber: null,
        inCurrentMonth: false,
        disabled: true,
        booked: false,
        price: null,
        priceLevel: null,
        inRange: false,
        isStart: false,
        isEnd: false
      });
    }

    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
      const date = new Date(year, month, dayNumber);
      date.setHours(0, 0, 0, 0);

      const iso = this.dateToIso(date);
      const rooms = this.getRoomsForSelectedType();

      const booked = rooms.length > 0
        ? rooms.every((room: any) => this.isRoomBookedOnDate(Number(room.id), date))
        : false;

      const disabled = !this.isDateEnabled(iso);
      const price = this.getLowestPriceForDateAcrossRoomType(date);
      const priceLevel = this.getPriceLevel(price);

      days.push({
        date,
        iso,
        dayNumber,
        inCurrentMonth: true,
        disabled,
        booked,
        price,
        priceLevel,
        inRange: this.isDateInSelectedRange(date),
        isStart: this.bookedFrom === iso,
        isEnd: this.bookedTo === iso
      });
    }

    while (days.length % 7 !== 0) {
      days.push({
        date: null,
        iso: null,
        dayNumber: null,
        inCurrentMonth: false,
        disabled: true,
        booked: false,
        price: null,
        priceLevel: null,
        inRange: false,
        isStart: false,
        isEnd: false
      });
    }

    this.calendarDays = days;
  }

  private rangeHasUnavailableDays(from: Date, to: Date): boolean {
    const current = new Date(from);

    while (current < to) {
      const iso = this.dateToIso(current);
      if (!this.isDateEnabled(iso)) {
        return true;
      }
      current.setDate(current.getDate() + 1);
    }

    return false;
  }

  private isRoomBookedOnDate(roomId: number, date: Date): boolean {
    return this.bookedRanges.some(r => {
      if (Number(r.roomId) !== Number(roomId)) {
        return false;
      }

      const from = new Date(r.from);
      const to = new Date(r.to);

      from.setHours(0, 0, 0, 0);
      to.setHours(0, 0, 0, 0);

      return date >= from && date < to;
    });
  }

  private isRoomAvailableForRange(roomId: number, fromIso: string, toIso: string): boolean {
    const from = this.isoToDateOnly(fromIso);
    const to = this.isoToDateOnly(toIso);
    const current = new Date(from);

    while (current < to) {
      if (this.isRoomBookedOnDate(roomId, current)) {
        return false;
      }
      current.setDate(current.getDate() + 1);
    }

    return true;
  }

  private findAvailableRoomForRange(fromIso: string, toIso: string) {
    const rooms = this.getRoomsForSelectedType();

    return rooms.find((room: any) =>
      this.isRoomAvailableForRange(Number(room.id), fromIso, toIso)
    ) || null;
  }

  private getLowestPriceForDateAcrossRoomType(date: Date): number | null {
    const rooms = this.getRoomsForSelectedType();
    const prices: number[] = [];

    rooms.forEach((room: any) => {
      const price = this.getPriceForRoomAndDate(room, date);
      if (price !== null && !isNaN(price) && price > 0) {
        prices.push(price);
      }
    });

    return prices.length ? Math.min(...prices) : null;
  }

  private getPriceForRoomAndDate(room: any, date: Date): number | null {
    if (!room?.seasonPrices || room.seasonPrices.length === 0) {
      return null;
    }

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    for (const sp of room.seasonPrices) {
      const rawFrom = (sp as any).dateFrom ?? (sp as any).fromDate ?? (sp as any).startDate ?? (sp as any).from;
      const rawTo = (sp as any).dateTo ?? (sp as any).toDate ?? (sp as any).endDate ?? (sp as any).to;
      const rawPrice = (sp as any).pricePerNight ?? (sp as any).price ?? null;

      if (!rawFrom || !rawTo || rawPrice === null || rawPrice === undefined) {
        continue;
      }

      const from = new Date(rawFrom);
      const to = new Date(rawTo);

      from.setHours(0, 0, 0, 0);
      to.setHours(0, 0, 0, 0);

      if (target >= from && target <= to) {
        const price = Number(rawPrice);
        return isNaN(price) ? null : price;
      }
    }

    return null;
  }

  private getPriceLevel(price: number | null): PriceLevel {
    if (price === null) return null;

    const rooms = this.getRoomsForSelectedType();
    const allPrices: number[] = [];

    rooms.forEach((room: any) => {
      if (room.seasonPrices?.length) {
        room.seasonPrices.forEach((sp: any) => {
          const p = Number((sp as any).pricePerNight ?? (sp as any).price);
          if (!isNaN(p) && p > 0) {
            allPrices.push(p);
          }
        });
      }
    });

    if (allPrices.length === 0) return null;

    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);

    if (min === max) return 'mid';

    const step = (max - min) / 3;

    if (price <= min + step) return 'low';
    if (price <= min + step * 2) return 'mid';
    return 'high';
  }

  private isDateInSelectedRange(date: Date): boolean {
    if (!this.bookedFrom) return false;

    const from = this.isoToDateOnly(this.bookedFrom);

    if (!this.bookedTo) {
      return date.getTime() === from.getTime();
    }

    const to = this.isoToDateOnly(this.bookedTo);
    return date >= from && date <= to;
  }

  private dateToIso(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private isoToDateOnly(iso: string): Date {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private getTodayDateOnly(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  
  private getPriceForSeasonDate(season: any, targetDate: Date): number | null {
    const rawFrom = season?.dateFrom ?? season?.fromDate ?? season?.startDate ?? season?.from;
    const rawTo = season?.dateTo ?? season?.toDate ?? season?.endDate ?? season?.to;
    const rawPrice = season?.pricePerNight ?? season?.price ?? null;
  
    if (!rawFrom || !rawTo || rawPrice === null || rawPrice === undefined) {
      return null;
    }
  
    const from = new Date(rawFrom);
    const to = new Date(rawTo);
  
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);
  
    if (targetDate >= from && targetDate <= to) {
      const price = Number(rawPrice);
      return isNaN(price) ? null : price;
    }
  
    return null;
  }
  
  getSelectedTypeCurrentPrice(): number | null {
    const rooms = this.getRoomsForSelectedType();
    const today = this.getTodayDateOnly();
    const prices: number[] = [];
  
    rooms.forEach((room: any) => {
      if (room.seasonPrices?.length) {
        room.seasonPrices.forEach((sp: any) => {
          const price = this.getPriceForSeasonDate(sp, today);
          if (price !== null && price > 0) {
            prices.push(price);
          }
        });
      }
    });
  
    return prices.length ? Math.min(...prices) : null;
  }
}