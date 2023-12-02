import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActionSheetController, ModalController, NavController } from '@ionic/angular';
import { PlacesService } from '../../places.service';
import { Place } from '../../place.model';
import { CreateBookingComponent } from 'src/app/bookings/create-booking/create-booking.component';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit {

  place: Place | undefined;

  constructor(private navCtrl: NavController, private route: ActivatedRoute, private placesService: PlacesService, private modalController: ModalController, private actionSheetCtrl: ActionSheetController) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/discover');
        return;
      }
      this.place = this.placesService.getPlace(paramMap.get('placeId'));
    });
  }

  onBookPlace() {
    this.actionSheetCtrl.create({
      header: 'Choose an Action',
      buttons: [{
        text: 'Select Date',
        handler: () => { 
          this.openBookingModal('select');
        }
      }, {
        text: 'Rondom Date',
        handler: () => { 
          this.openBookingModal('rondom');}
      }, {
        text: 'Cancel',
        role: 'destructive'
      }]
    }).then(actionSheetEl => {
      actionSheetEl.present();
    });

  }

  openBookingModal(mode: 'select' | 'rondom') {
    console.log(mode);


    this.modalController.create({
      component: CreateBookingComponent,
      componentProps: { selectedPlace: this.place }
    }).
      then(modalEl => {
        modalEl.present();
      });
  }
}
