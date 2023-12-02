import { Component, OnInit } from '@angular/core';
import { PlacesService } from '../places.service';
import { Place } from '../place.model';
import { AuthService } from 'src/app/auth/auth.service';
import { Router } from '@angular/router';
import { SegmentChangeEventDetail } from '@ionic/angular';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit {

  loadedPlaces: Place[];

  
  constructor(private placesService: PlacesService,private authService: AuthService,private router: Router) {
    this.loadedPlaces = this.placesService.getPlaces;
   }

  ngOnInit() {
    this.loadedPlaces = this.placesService.getPlaces;
  }

  onLogout(){
    this.authService.logout();
    this.router.navigateByUrl('/auth');

  }
  onFilterUpdate(event:CustomEvent<SegmentChangeEventDetail>){
    console.log(event.detail);
  }
}
