import { Injectable } from '@angular/core';
import { Booking } from './booking.model';
import { BehaviorSubject, delay, map, switchMap, take, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { HttpClient } from '@angular/common/http';

interface BookingData {
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
    const newBooking = new Booking(
      Math.random().toString(),
      placeId,
      this.authService.userId,
      placeTitle,
      placeImage,
      firstname,
      lastName, guestNumber,
      dateFrom,
      dateTo
    );
    return this.http.post<{ name: string }>('https://ionic-angular-bookings-6e001-default-rtdb.europe-west1.firebasedatabase.app/bookings.json',
      { ...newBooking, id: null }
    ).pipe(switchMap(resdData => {
      generatedId = resdData.name;
      return this.bookings;
    }),
      take(1),
      tap(bookings => {
        newBooking.id = generatedId;
        this._bookings.next(bookings.concat(newBooking));
      }));
  }

  fetchBookings() {
    return this.http.get<{ [key: string]: BookingData }>(`https://ionic-angular-bookings-6e001-default-rtdb.europe-west1.firebasedatabase.app/bookings.json?orderBy="userId"&equalTo="${this.authService.userId}"`)
      .pipe(
        map(bookingData => {
          const bookings = [];
          for (const key in bookingData) {
            if (bookingData.hasOwnProperty(key)) {
              bookings.push(
                new Booking(key,
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
          }
          return bookings;
        }), tap(bookings => {
          this._bookings.next(bookings);
        })
      );
  }

  cancelBooking(bookingId: string) {
    return this.http.delete(`https://ionic-angular-bookings-6e001-default-rtdb.europe-west1.firebasedatabase.app/bookings/${bookingId}.json`)
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
