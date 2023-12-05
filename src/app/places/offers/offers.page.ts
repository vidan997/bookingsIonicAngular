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
  isLoading = false;
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

  ionViewWillEnter(){
    this.isLoading=true;
    this.placesService.fetchPlaces().subscribe(()=>{
      this.isLoading=false;
    });
  }


  onEdit(id: string) {
    console.log('Editing');
  }
}
