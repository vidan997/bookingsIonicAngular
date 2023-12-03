import { Component, OnInit } from '@angular/core';
import { PlacesService } from '../places.service';
import { Place } from '../place.model';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.page.html',
  styleUrls: ['./offers.page.scss'],
})
export class OffersPage implements OnInit {

  offers: Place[];

  constructor(private placesService : PlacesService,private menuCtrl: MenuController) { 
    this.offers = placesService.getPlaces;
  }

  ngOnInit() {
    this.offers = this.placesService.getPlaces;
  }

  onEdit(id: string | undefined){
    console.log('Editing');
  }
}