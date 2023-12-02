import { Injectable } from '@angular/core';
import { Booking } from './booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private _bookings: Booking[] =[
    new Booking(
      'xyz',
      'p1',
      'abc',
      'Vikendica na Zlatiboru',
      2)
  ];
  constructor() { }

  get bookings(){
    return [...this._bookings];
  }
}
