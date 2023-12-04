import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlacesService } from '../places.service';
import { Place } from '../place.model';
import { MenuController } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.page.html',
  styleUrls: ['./offers.page.scss'],
})
export class OffersPage implements OnInit,OnDestroy {

  offers!: Place[];
  private placesSub!: Subscription;

  constructor(private placesService: PlacesService, private menuCtrl: MenuController) {

  }
  ngOnDestroy(): void {
    if(this.placesSub){
      this.placesSub.unsubscribe();
    }
  }

  ngOnInit() {
    this.placesSub = this.placesService.places.subscribe(places =>{
      this.offers=places;
    });
  }


  onEdit(id: string | undefined) {
    console.log('Editing');
  }
}
