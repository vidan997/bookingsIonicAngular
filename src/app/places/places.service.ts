import { Injectable } from '@angular/core';
import { Place } from './place.model';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, map, of, switchMap, take, tap } from 'rxjs';
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
  private _places = new BehaviorSubject<Place[]>([]);
  private _placesById = new BehaviorSubject<Place[]>([]);


  constructor(private authService: AuthService, private http: HttpClient) { }

  get places() {
    return this._places.asObservable();
  }
  get placesById() {
    return this._placesById.asObservable();
  }

  getPlace(placeId: string) {
    return this.http.
      get<PlaceData>(`https://ionic-angular-bookings-6e001-default-rtdb.europe-west1.firebasedatabase.app/offered-places/${placeId}.json`).
      pipe(
        map(placeData => {
          return new Place(
            placeId,
            placeData.title,
            placeData.description,
            placeData.imageUrl,
            placeData.price,
            new Date(placeData.avaiableFrom),
            new Date(placeData.availableTo),
            placeData.userId);
        })
      );
  }

  fetchPlaces() {
    return this.http
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

  fetchPlacesByUserId() {
    return this.authService.userId.pipe(switchMap(userId => {
      console.log(userId);
      return this.http.get<{ [key: string]: PlaceData }>(`https://ionic-angular-bookings-6e001-default-rtdb.europe-west1.firebasedatabase.app/offered-places.json?orderBy="userId"&equalTo="${userId}"`);
    }), map(resData => {
      console.log(resData);
      const placeuserID = [];
      for (const key in resData) {
        if (resData.hasOwnProperty(key)) {
          placeuserID.push(new Place(
            key,
            resData[key].title,
            resData[key].description,
            resData[key].imageUrl,
            resData[key].price,
            new Date(resData[key].avaiableFrom!),
            new Date(resData[key].availableTo!),
            resData[key].userId));
        }
      }
      return placeuserID;
    }), tap(placeuserID => {
      this._placesById.next(placeuserID);
    })
    );
  }

  addPlace(
    title: string,
    description: string,
    price: number,
    dateFrom: Date,
    dateTo: Date,
    imageurl: string) {

    let generatedId: string;
    let newPlace: Place;
    return this.authService.userId.pipe(take(1), switchMap(userId => {
      if (!userId) {
        throw new Error('User not found!');
      }
      newPlace = new Place(
        Math.random().toString(),
        title,
        description,
        imageurl,
        price,
        dateFrom,
        dateTo,
        userId
      );
      return this.http.post<{ name: string }>('https://ionic-angular-bookings-6e001-default-rtdb.europe-west1.firebasedatabase.app/offered-places.json', { ...newPlace, id: null });
    }), switchMap(resData => {
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

  updatePlace(placeId: string, title: string, description: string,price: number) {
    let updatedPlaces: Place[];
    return this.places.pipe(
      take(1),
      switchMap(places => {
        if (!places || places.length < 0) {
          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }), switchMap(places => {
        const updatedPlaceIndex = places.findIndex(pl => pl.id === placeId);
        updatedPlaces = [...places];
        const old = updatedPlaces[updatedPlaceIndex];
        updatedPlaces[updatedPlaceIndex] = new Place(
          old.id,
          title,
          description,
          old.imageUrl,
          price,
          old.avaiableFrom,
          old.availableTo,
          old.userId);
        return this.http.put(
          `https://ionic-angular-bookings-6e001-default-rtdb.europe-west1.firebasedatabase.app/offered-places/${placeId}.json`,
          { ...updatedPlaces[updatedPlaceIndex], id: null });
      })
      , tap(resData => {
        this._places.next(updatedPlaces);
      }));
  }

}
