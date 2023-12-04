import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlacesService } from '../places.service';
import { Place } from '../place.model';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';
import { SegmentChangeEventDetail } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit, OnDestroy {

  loadedPlaces!: Place[];
  relevantPlaces!: Place[];
  private placesSub!: Subscription;


  constructor(private placesService: PlacesService, private authService: AuthService, private router: Router) {
  }
  ngOnDestroy(): void {
    if (this.placesSub) {
      this.placesSub.unsubscribe();
    }
  }

  ngOnInit() {
    this.placesSub = this.placesService.places.subscribe(places => {
      this.loadedPlaces = places;
      this.relevantPlaces = this.loadedPlaces;
    });
  }

  onLogout() {
    this.authService.logout();
    this.router.navigateByUrl('/auth');

  }

  onFilterUpdate(event: CustomEvent<SegmentChangeEventDetail>) {

    console.log(event.detail);
    if (event.detail.value === 'all') {
      this.relevantPlaces = this.loadedPlaces;
    } else {
      this.relevantPlaces = this.loadedPlaces.filter(
        place => place.userId !== this.authService.userId && place.availableTo! > new Date
        );
    }
  }
}
