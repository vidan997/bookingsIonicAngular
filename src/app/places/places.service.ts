import { Injectable } from '@angular/core';
import { Place } from './place.model';
import { AuthService } from '../auth/auth.service';
import { BehaviorSubject, map, of, switchMap, take, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface PlaceData {
  id: string;
  avaiableFrom: string;
  avaiableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: number;
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
    var token: string | null;
    let headers;
    this.authService.userToken.subscribe(userToken => {
      token = userToken;
      headers = { 'Authorization': 'Bearer ' + token }
    });

    return this.http.
      get<PlaceData>(`http://localhost:8080/place/get/${placeId}`, { headers }).
      pipe(
        map(placeData => {
          return new Place(
            placeData.id,
            placeData.title,
            placeData.description,
            placeData.imageUrl,
            placeData.price,
            new Date(placeData.avaiableFrom),
            new Date(placeData.avaiableTo),
            placeData.userId);
        })
      );
  }

  fetchPlaces() {
    return this.authService.userToken.pipe(switchMap(userToken => {
      const headers = { 'Authorization': 'Bearer ' + userToken }
      return this.http.get<PlaceData[]>('http://localhost:8080/place/all', { headers })
    }), map(resData => {
      const places = [];
      for (const key in resData) {
        places.push(new Place(
          resData[key].id,
          resData[key].title,
          resData[key].description,
          resData[key].imageUrl,
          resData[key].price,
          new Date(resData[key].avaiableFrom),
          new Date(resData[key].avaiableTo),
          resData[key].userId));
      }
      return places;
    }),
      tap(places => {
        this._places.next(places);
      })
    );
  }

  fetchPlacesByUserId() {
    var token: string | null;
    this.authService.userToken.subscribe(userToken => {
      token = userToken;
    });
    return this.authService.userId.pipe(switchMap(userMail => {
      const headers = { 'Authorization': 'Bearer ' + token }
      return this.http.get<PlaceData[]>(`http://localhost:8080/place/get/all/${userMail}`, { headers });
    }), map(resData => {
      const placeuserID: any[] = [];
      for (const key in resData) {
        placeuserID.push(new Place(
          resData[key].id,
          resData[key].title,
          resData[key].description,
          resData[key].imageUrl,
          resData[key].price,
          new Date(resData[key].avaiableFrom!),
          new Date(resData[key].avaiableTo!),
          resData[key].userId));

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

    var token: string | null;
    this.authService.userToken.subscribe(userToken => {
      token = userToken;
    });
    let generatedId: string | undefined;
    let newPlace: Place;
    return this.authService.userId.pipe(take(1), switchMap(userId => {
      if (!userId) {
        throw new Error('User not found!');
      }
      newPlace = new Place(
        "1",
        title,
        description,
        imageurl,
        price,
        dateFrom,
        dateTo,
        userId
      );
      const headers = { 'Authorization': 'Bearer ' + token }
      return this.http.post<Place>('http://localhost:8080/place/save', newPlace, { headers });
    }), switchMap(resData => {
      generatedId = resData.id;
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

  updatePlace(placeId: string, title: string, description: string, price: number) {
    let updatedPlaces: Place[];
    var token: string | null;
    this.authService.userToken.subscribe(userToken => {
      token = userToken;
    });
    return this.places.pipe(
      take(1),
      switchMap(places => {
        if (!places || places.length < 0) {
          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }), switchMap(places => {
        const updatedPlaceIndex = places.findIndex(pl => pl.id == placeId);
        updatedPlaces = [...places];
        const old = updatedPlaces[updatedPlaceIndex];
        updatedPlaces[updatedPlaceIndex] = new Place(
          old.id,
          title,
          description,
          old.imageUrl,
          price,
          old.avaiableFrom,
          old.avaiableTo,
          old.userId);
        const headers = { 'Authorization': 'Bearer ' + token }
        return this.http.put(
          `http://localhost:8080/place/update`,
          updatedPlaces[updatedPlaceIndex],{headers});
      })
      , tap(resData => {
        this._places.next(updatedPlaces);
      }));
  }

}
