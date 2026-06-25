import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlacesService } from '../places.service';
import { Place } from '../place.model';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';
import { SegmentChangeEventDetail } from '@ionic/angular';
import { Subscription, take } from 'rxjs';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit, OnDestroy {

  loadedPlaces: Place[] = [];
  relevantPlaces: Place[] = [];

  private placesSub!: Subscription;
  isLoading = false;

  segmentValue: 'all' | 'bookable' = 'all';

  constructor(
    private placesService: PlacesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.placesSub = this.placesService.places.subscribe(places => {
      this.loadedPlaces = places;
      this.applyFilter();
    });
  }

  ionViewWillEnter() {
    this.isLoading = true;

    this.placesService.fetchPlaces().subscribe({
      next: () => {
        this.isLoading = false;
        this.applyFilter();
      },
      error: (err) => {
        console.log('fetchPlaces error', err);
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.placesSub) {
      this.placesSub.unsubscribe();
    }
  }

  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  getImageUrl(path?: string) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return 'http://localhost:8080' + path;
  }

  onFilterUpdate(event: CustomEvent<SegmentChangeEventDetail>) {
    this.segmentValue = (event.detail.value as 'all' | 'bookable') || 'all';
    this.applyFilter();
  }

  private applyFilter() {
    if (!this.loadedPlaces) {
      this.relevantPlaces = [];
      return;
    }

    if (!this.isLoggedIn()) {
      this.relevantPlaces = this.loadedPlaces;
      return;
    }

    this.authService.userId.pipe(take(1)).subscribe(userId => {
      if (this.segmentValue === 'all') {
        this.relevantPlaces = this.loadedPlaces;
      } else {
        this.relevantPlaces = this.loadedPlaces.filter(place =>
          String(place.userId) !== String(userId) &&
          !!place.avaiableTo &&
          place.avaiableTo > new Date()
        );
      }
    });
  }

  getRoomTypesText(place: Place): string {
    if (!place.rooms || place.rooms.length === 0) {
      return '';
    }

    const uniqueTypes = [...new Set(
      place.rooms
        .map(room => room.roomType)
        .filter(type => !!type)
    )];

    return uniqueTypes.join(', ');
  }

  getRoomNamesText(place: Place): string {
    if (!place.rooms || place.rooms.length === 0) {
      return '';
    }

    return place.rooms
      .map(room => room.name)
      .filter(name => !!name)
      .join(', ');
  }

  getRoomsCount(place: Place): number {
    return place.rooms ? place.rooms.length : 0;
  }

  getMinCapacity(place: Place): number | null {
    if (!place.rooms || place.rooms.length === 0) {
      return null;
    }

    return Math.min(...place.rooms.map(room => Number(room.capacity || 0)));
  }

  getMaxCapacity(place: Place): number | null {
    if (!place.rooms || place.rooms.length === 0) {
      return null;
    }

    return Math.max(...place.rooms.map(room => Number(room.capacity || 0)));
  }

  onOpenPlace(placeId: string) {
    this.router.navigate(['/places/tabs/discover', placeId]);
  }
}