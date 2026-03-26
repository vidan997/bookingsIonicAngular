import { Component, OnDestroy, OnInit } from '@angular/core';
import { PlacesService } from '../places.service';
import { Place } from '../place.model';
import { AlertController, IonItemSliding, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-offers',
  templateUrl: './offers.page.html',
  styleUrls: ['./offers.page.scss'],
})
export class OffersPage implements OnInit, OnDestroy {

  offers: Place[] = [];
  isLoading = false;
  private placesSub!: Subscription;

  constructor(
    private placesService: PlacesService,
    private alertCtrl: AlertController,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.placesSub = this.placesService.placesById.subscribe(places => {
      this.offers = places || [];
    });
  }

  ionViewWillEnter() {
    this.refreshOffers();
  }

  ngOnDestroy(): void {
    if (this.placesSub) this.placesSub.unsubscribe();
  }

  trackByOfferId(index: number, item: Place) {
    return item.id;
  }

  private refreshOffers() {
    this.isLoading = true;
    this.placesService.fetchPlacesByUserId().subscribe({
      next: () => this.isLoading = false,
      error: (err) => {
        console.log('fetchPlacesByUserId error', err);
        this.isLoading = false;
      }
    });
  }

  onDelete(id: string, slidingItem: IonItemSliding) {
    this.alertCtrl.create({
      header: 'Delete offer?',
      message: 'Are you sure you want to delete this offer?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            slidingItem.close();
  
            this.placesService.deletePlace(id).subscribe({
              next: () => {},
              error: (err) => console.log('deletePlace error', err)
            });
          }
        }
      ]
    }).then(a => a.present());
  }
  

  getCoverUrl(offer: Place): string {
    if (offer?.imageUrl) return offer.imageUrl;
    if (offer?.imageUrls && offer.imageUrls.length > 0) return offer.imageUrls[0];
    return '';
  }

  getImageUrl(path?: string) {
    if (!path) return '';
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http')) return path;
    return 'http://localhost:8080' + path;
  }
}
