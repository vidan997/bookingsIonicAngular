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
  userId: number;
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
    var token: string | null;
    this.authService.userToken.subscribe(userToken => {
      token = userToken;
    });

    return this.authService.userId.pipe(take(1), switchMap(userId => {
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
      const headers = { 'Authorization': 'Bearer ' + token }
      return this.http.post<Booking>('http://localhost:8080/booking/save',
        newBooking,{headers}
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
    var token: string | null;
    this.authService.userToken.subscribe(userToken => {
      token = userToken;
    });
    return this.authService.userId.pipe(switchMap(userId => {
      const headers = { 'Authorization': 'Bearer ' + token }
      return this.http.get<BookingData[]>(`http://localhost:8080/booking/get/all/${userId}`, { headers });
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
    var token: string | null;
    let headers;
    this.authService.userToken.subscribe(userToken => {
      token = userToken;
      headers = { 'Authorization': 'Bearer ' + token }
    });
    return this.http.delete(`http://localhost:8080/booking/delete/${bookingId}`,{headers})
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
