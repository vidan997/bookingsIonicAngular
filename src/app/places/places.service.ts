import { Injectable } from '@angular/core';
import { Place } from './place.model';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, delay, generate, map, switchMap, take, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface PlaceData {
  avaiableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private _places = new BehaviorSubject<Place[]>([
    new Place(
      'p1',
      'Vikendica na Zlatiboru',
      'Sa pogledom na planine.',
      'https://cf.bstatic.com/xdata/images/hotel/max1024x768/271649742.jpg?k=ab00ae5f8ce8cc3cc148a4a6cab701a5d7bb3141d6079f76aab077a21324d200&o=&hp=1',
      149.99,
      new Date('2019-01-01'),
      new Date('2019-12-01'),
      'abc'),
    new Place(
      'p2',
      'Kopaonik',
      'Hotel sa 4 zvezdice',
      'https://cf.bstatic.com/xdata/images/hotel/max1024x768/408555873.jpg?k=d2047f0d573371fc42bc560bffb9de042b19219dda5eedf577a2a0ed8888ac23&o=&hp=1',
      99.99,
      new Date('2019-01-01'),
      new Date('2019-12-01'),
      'abc'),
    new Place(
      'p3',
      'Divcibare',
      'Za Divčibare vikendice predstavljaju prave male oaze mira, vikendice na Divčibarama su mesto gde možete uživati u svakom trenutku vašeg odmora i napuniti baterije za naredne radne dane. Ko traži vikendice Divčibare je planina na kojoj ih ima u izobilju privatni smeštaj u vikendicama na Divčibarama je veoma popularan vid turizma širom Divčibara. Ako i vama treba ove zime za Divčibare smeštaj vikendica ima dovoljno da prime sve ljubitelje zimskih čarolija, koji su rešili da svoje dane odmora provedu u ovom predivnom kraju, a vikendice na Divčibarama jedva čekaju svoje nove stanare, nove posetioce da stvore svoje uspomene.',
      'https://www.divcibare.org.rs/wp-content/uploads/2021/11/vikendica-bajka-izdvojena.jpg',
      99.99,
      new Date('2019-01-01'),
      new Date('2025-12-01'),
      'xyz')
  ]);


  constructor(private authService: AuthService, private htttp: HttpClient) { }

  get places() {
    return this._places.asObservable();
  }

  getPlace(id: string | null) {
    return this.places.pipe(take(1), map(places => {
      return { ...places.find(p => p.id == id) }
    }));
  }

  fetchPlaces() {
    return this.htttp
      .get<{ [key: string]: PlaceData }>('https://ionic-angular-bookings-6e001-default-rtdb.europe-west1.firebasedatabase.app/offered-places.json')
      .pipe(map(resData => {
        const places = [];
        for (const key in resData) {
          if (resData.hasOwnProperty(key)) {
            places.push(new Place(
              key,
              resData[key].title,
              resData[key].description,
              resData[key].imageUrl,
              resData[key].price,
              new Date(resData[key].avaiableFrom),
              new Date(resData[key].availableTo),
              resData[key].userId));
          }
        }
        return places;
      }),
        tap(places => {
          this._places.next(places);
        })
      );
  }

  addPlace(
    title: string,
    description: string,
    price: number,
    dateFrom: Date,
    dateTo: Date) {

    let generatedId: string;
    const newPlace = new Place(
      Math.random().toString(),
      title,
      description,
      'https://cf.bstatic.com/xdata/images/hotel/max1024x768/271649742.jpg?k=ab00ae5f8ce8cc3cc148a4a6cab701a5d7bb3141d6079f76aab077a21324d200&o=&hp=1',
      price,
      dateFrom,
      dateTo,
      this.authService.userId
    );
    return this.htttp
      .post<{ name: string }>('https://ionic-angular-bookings-6e001-default-rtdb.europe-west1.firebasedatabase.app/offered-places.json', { ...newPlace, id: null })
      .pipe(switchMap(resData => {
        generatedId = resData.name;
        return this.places;
      }),
        take(1),
        tap(places => {
          newPlace.id = generatedId;
          this._places.next(places.concat(newPlace));
          console.log(generatedId);
        })
      );
  }

  updatePlace(placeId: string, title: string, description: string) {
    return this.places.pipe(
      take(1),
      delay(1000),
      tap(places => {
        const updatedPlaceIndex = places.findIndex(pl => pl.id === placeId);
        const updatedPlaces = [...places];
        const old = updatedPlaces[updatedPlaceIndex];
        updatedPlaces[updatedPlaceIndex] = new Place(
          old.id,
          title,
          description,
          old.imageUrl,
          old.price,
          old.avaiableFrom,
          old.availableTo,
          old.userId);
        this._places.next(updatedPlaces);

      }));

  }

}
