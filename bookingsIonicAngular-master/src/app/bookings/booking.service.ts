import { Injectable } from '@angular/core';
import { BehaviorSubject, map, switchMap, take, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Booking } from './booking.model';
import { AuthService } from '../auth/auth.service';

interface BookingData {
  id: string;
  placeId: string;
  roomid: number;
  userid: string;
  firstName: string;
  lastName: string;
  bookedFrom: string;
  bookedTo: string;
  roomType: string;
  priceAtBooking: number;
  placeTitle: string;
  placeImage: string;
  ownerPhone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private _bookings = new BehaviorSubject<Booking[]>([]);
  private baseUrl = 'http://localhost:8080';

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  get bookings() {
    return this._bookings.asObservable();
  }

  private mapToBooking(b: BookingData): Booking {
    return new Booking(
      String(b.id),
      String(b.placeId),
      Number(b.roomid),
      b.userid,
      b.placeTitle,
      b.placeImage,
      b.firstName,
      b.lastName,
      new Date(b.bookedFrom),
      new Date(b.bookedTo),
      b.roomType,
      Number(b.priceAtBooking),
      b.ownerPhone
    );
  }

  private authHeaders(token: string) {
    return { Authorization: 'Bearer ' + token };
  }

  addBooking(
    placeId: string,
    placeTitle: string,
    placeImage: string,
    roomid: number,
    roomType: string,
    priceAtBooking: number,
    firstName: string,
    lastName: string,
    bookedFrom: Date,
    bookedTo: Date
  ) {
    return this.authService.userId.pipe(
      take(1),
      switchMap(userId => {
        if (userId === null || userId === undefined) {
          throw new Error('No user id found!');
        }

        return this.authService.userToken.pipe(
          take(1),
          switchMap(token => {
            if (!token) throw new Error('No token found!');

            const body = {
              id: 0,
              placeId: Number(placeId),
              roomid: Number(roomid),
              userid: String(userId),
              firstName,
              lastName,
              bookedFrom,
              bookedTo,
              roomType,
              priceAtBooking: Number(priceAtBooking),
              placeTitle,
              placeImage
            };

            return this.http.post<BookingData>(
              `${this.baseUrl}/booking/save`,
              body,
              { headers: { Authorization: 'Bearer ' + token } }
            );
          })
        );
      }),
      map(saved => this.mapToBooking(saved)),
      switchMap(savedBooking =>
        this.bookings.pipe(
          take(1),
          tap(curr => this._bookings.next(curr.concat(savedBooking)))
        )
      )
    );
  }

  fetchBookings() {
    return this.authService.userId.pipe(
      take(1),
      switchMap(userId => {
        if (userId === null || userId === undefined) {
          throw new Error('No user id found!');
        }

        return this.authService.userToken.pipe(
          take(1),
          switchMap(token => {
            if (!token) throw new Error('No token found!');

            return this.http.get<BookingData[]>(
              `${this.baseUrl}/booking/get/all/${userId}`,
              { headers: { Authorization: 'Bearer ' + token } }
            );
          })
        );
      }),
      map(list => list.map(x => this.mapToBooking(x))),
      tap(list => this._bookings.next(list))
    );
  }

  cancelBooking(bookingId: string) {
    return this.authService.userToken.pipe(
      take(1),
      switchMap(token => {
        if (!token) throw new Error('No token found!');
        return this.http.delete(
          `${this.baseUrl}/booking/delete/${bookingId}`,
          { headers: this.authHeaders(token) }
        );
      }),
      switchMap(() => this.bookings),
      take(1),
      tap(bookings => {
        this._bookings.next(bookings.filter(b => b.id !== bookingId));
      })
    );
  }

  fetchBookingsForPlace(placeId: string) {
    return this.authService.userToken.pipe(
      take(1),
      switchMap(token => {
        if (!token) throw new Error('No token found!');
        return this.http.get<BookingData[]>(
          `${this.baseUrl}/booking/get/place/${placeId}`,
          { headers: this.authHeaders(token) }
        );
      }),
      map(list => list.map(x => this.mapToBooking(x)))
    );
  }
}