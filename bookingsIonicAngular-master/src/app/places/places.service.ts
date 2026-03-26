import { Injectable } from '@angular/core';
import { BehaviorSubject, map, switchMap, take, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Place } from './place.model';
import { AuthService } from '../auth/auth.service';

interface PlaceData {
  id: string;
  avaiableFrom: string;
  avaiableTo: string;
  description: string;
  imageUrl: string;
  imageUrls?: string[];
  price: number | string;
  title: string;
  userId: number;

  rooms?: {
    id: number;
    placeid: number;
    roomType: string;
    price: number;
    quantity: number;
  }[];
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

  private mapToPlace(placeData: PlaceData): Place {
    const rooms = placeData.rooms
      ? placeData.rooms.map(r => ({
        id: r.id,
        placeid: r.placeid,
        roomType: r.roomType,
        price: r.price,
        quantity: r.quantity
      }))
      : [];

    return new Place(
      placeData.id,
      placeData.title,
      placeData.description,
      placeData.imageUrl,
      placeData.imageUrls && placeData.imageUrls.length > 0
        ? placeData.imageUrls
        : placeData.imageUrl
          ? [placeData.imageUrl]
          : [],
      new Date(placeData.avaiableFrom),
      new Date(placeData.avaiableTo),
      placeData.userId,
      rooms
    );
  }



  getPlace(placeId: string) {
    return this.authService.userToken.pipe(
      take(1),
      switchMap(userToken => {
        if (!userToken) {
          return this.http.get<PlaceData>(`http://localhost:8080/place/get/${placeId}`);
        }
        const headers = { Authorization: 'Bearer ' + userToken };
        return this.http.get<PlaceData>(`http://localhost:8080/place/get/${placeId}`, { headers });
      }),
      map(placeData => this.mapToPlace(placeData))
    );
  }

  fetchPlaces() {
    return this.authService.userToken.pipe(
      take(1),
      switchMap(userToken => {
        if (!userToken) {
          return this.http.get<PlaceData[]>('http://localhost:8080/place/all');
        }
        const headers = { Authorization: 'Bearer ' + userToken };
        return this.http.get<PlaceData[]>('http://localhost:8080/place/all', { headers });
      }),
      map(resData => resData.map(p => this.mapToPlace(p))),
      tap(places => this._places.next(places))
    );
  }

  fetchPlacesByUserId() {
    return this.authService.userId.pipe(
      take(1),
      switchMap(userId => {
        return this.authService.userToken.pipe(
          take(1),
          switchMap(token => {
            const headers = { Authorization: 'Bearer ' + token };
            return this.http.get<PlaceData[]>(`http://localhost:8080/place/get/all/${userId}`, { headers });
          })
        );
      }),
      map(resData => resData.map(p => this.mapToPlace(p))),
      tap(places => this._placesById.next(places))
    );
  }

  addPlaceMultipart(
    title: string,
    description: string,
    dateFrom: Date,
    dateTo: Date,
    images: File[],
    coverIndex: number,
    rooms: { roomType: string; price: number; quantity: number }[]
  ) {
    return this.authService.userId.pipe(
      take(1),
      switchMap(userId => {
        if (!userId) {
          throw new Error('User not found!');
        }

        return this.authService.userToken.pipe(
          take(1),
          switchMap(token => {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('avaiableFrom', dateFrom.toISOString());
            formData.append('avaiableTo', dateTo.toISOString());
            formData.append('userId', String(userId));
            formData.append('coverIndex', String(coverIndex));
            formData.append('rooms', JSON.stringify(rooms));

            images.forEach(img => formData.append('images', img));

            const headers = { Authorization: 'Bearer ' + token };
            return this.http.post<PlaceData>('http://localhost:8080/place/save-multipart', formData, { headers });
          })
        );
      }),
      switchMap(() => this.fetchPlaces()),
      switchMap(() => this.fetchPlacesByUserId())
    );
  }

  updatePlaceMultipart(
    placeId: string,
    title: string,
    description: string,
    existingImages: string[],
    newImages: File[],
    coverIndex: number,
    rooms: { id?: number; placeid?: number; roomType: string; price: number; quantity: number }[]
  ) {
    return this.authService.userToken.pipe(
      take(1),
      switchMap(token => {
        const formData = new FormData();
        formData.append('id', placeId);
        formData.append('title', title);
        formData.append('description', description);
        formData.append('coverIndex', String(coverIndex));
        formData.append('rooms', JSON.stringify(rooms));

        existingImages.forEach(img => formData.append('existingImages', img));
        newImages.forEach(file => formData.append('images', file));

        const headers = { Authorization: 'Bearer ' + token };
        return this.http.put('http://localhost:8080/place/update-multipart', formData, { headers });
      }),
      switchMap(() => this.fetchPlaces()),
      switchMap(() => this.fetchPlacesByUserId())
    );
  }

  deletePlace(placeId: string) {
    return this.authService.userToken.pipe(
      take(1),
      switchMap(token => {
        const headers = { Authorization: 'Bearer ' + token };
        return this.http.delete(`http://localhost:8080/place/delete/${placeId}`, {
          headers,
          responseType: 'text'
        });
      }),
      tap(() => {
        const currentById = this._placesById.getValue();
        this._placesById.next(currentById.filter(p => p.id !== placeId));

        const currentAll = this._places.getValue();
        this._places.next(currentAll.filter(p => p.id !== placeId));
      })
    );
  }


}
