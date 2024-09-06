import { Injectable } from '@angular/core';
import { Booking } from './booking.model';
import { BehaviorSubject, delay, map, switchMap, take, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { HttpClient } from '@angular/common/http';

interface BookingData {
  id: string;
  bookedFrom: string;
  bookedTo: string;
  firstName: string;
  guestNumber: number;
  lastName: string;
  placeId: string;
  placeImage: string;
  placeTitle: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private _bookings = new BehaviorSubject<Booking[]>([]);

  constructor(private authService: AuthService, private http: HttpClient) { }

  get bookings() {
    return this._bookings.asObservable();
  }

  addBooking(placeId: string, placeTitle: string, placeImage: string, firstname: string, lastName: string, guestNumber: number, dateFrom: Date, dateTo: Date) {
    let generatedId: string;
    let newBooking: Booking;
    return this.authService.userMail.pipe(take(1), switchMap(userId => {
      if (!userId) {
        throw new Error('No user id found!');
      }
      console.log(guestNumber);
      newBooking = new Booking(
        "999",
        placeId,
        userId,
        placeTitle,
        placeImage,
        firstname,
        lastName, 
        guestNumber,
        dateFrom,
        dateTo
      );
      return this.http.post<Booking>('http://localhost:8080/booking/save',
        newBooking
      );
    }), switchMap(resdData => {
      generatedId = resdData.id;
      return this.bookings;
    }),
      take(1),
      tap(bookings => {
        newBooking.id = generatedId;
        this._bookings.next(bookings.concat(newBooking));
      }));
  }

  fetchBookings() {
    return this.authService.userMail.pipe(switchMap(userMail => {
      return this.http.get<BookingData[]>(`http://localhost:8080/booking/get/all/${userMail}`);
    }), map(bookingData => {
      const bookings = [];
      for (const key in bookingData) {

        bookings.push(
          new Booking(bookingData[key].id,
            bookingData[key].placeId,
            bookingData[key].userId,
            bookingData[key].placeTitle,
            bookingData[key].placeImage,
            bookingData[key].firstName,
            bookingData[key].lastName,
            bookingData[key].guestNumber,
            new Date(bookingData[key].bookedFrom),
            new Date(bookingData[key].bookedTo)));

      }
      return bookings;
    }), tap(bookings => {
      this._bookings.next(bookings);
    })
    );
  }

  cancelBooking(bookingId: string) {
    return this.http.delete(`http://localhost:8080/booking/delete/${bookingId}`)
      .pipe(
        switchMap(() => {
          return this.bookings;
        }),
        take(1),
        tap(bookings => {
          this._bookings.next(bookings.filter(b => b.id != bookingId));
        }));
  }
}
