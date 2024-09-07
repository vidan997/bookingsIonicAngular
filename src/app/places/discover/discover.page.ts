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

  loadedPlaces!: Place[];
  relevantPlaces!: Place[];
  private placesSub!: Subscription;
  isLoading = false;


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

  ionViewWillEnter() {
    this.isLoading = true;

    this.placesService.fetchPlaces().subscribe(() => {
      this.isLoading = false;
    });
  }

  onLogout() {
    this.router.navigateByUrl('/auth');
    this.authService.logout();
  }

  onFilterUpdate(event: CustomEvent<SegmentChangeEventDetail>) {
    this.authService.userId.pipe(take(1)).subscribe(userId => {
      console.log(userId);
      if (event.detail.value === 'all') {
        this.relevantPlaces = this.loadedPlaces;
      } else {
        this.relevantPlaces = this.loadedPlaces.filter(
          place => place.userId != userId && place.avaiableTo! > new Date() 
        );
      }

    });

  }
}
