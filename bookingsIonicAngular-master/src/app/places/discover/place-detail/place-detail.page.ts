import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ActionSheetController,
  LoadingController,
  ModalController,
  NavController
} from '@ionic/angular';
import { PlacesService } from '../../places.service';
import { Place } from '../../place.model';
import { CreateBookingComponent } from 'src/app/bookings/create-booking/create-booking.component';
import { Subscription, switchMap, take } from 'rxjs';
import { BookingService } from 'src/app/bookings/booking.service';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit, OnDestroy {

  place!: Place;
  private placesSub!: Subscription;

  isLoading = false;
  isBookable = false;

  selectedIndex = 0;
  selectedImageUrl = '';

  constructor(
    private navCtrl: NavController,
    private route: ActivatedRoute,
    private placesService: PlacesService,
    private modalController: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private bookingService: BookingService,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnDestroy(): void {
    if (this.placesSub) {
      this.placesSub.unsubscribe();
    }
  }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/discover');
        return;
      }

      this.isLoading = true;
      const placeId = paramMap.get('placeId')!;

      let fetchedUserId: any = null;

      this.placesSub = this.authService.userId.pipe(
        take(1),
        switchMap(userId => {
          fetchedUserId = userId ?? null;
          return this.placesService.getPlace(placeId);
        })
      ).subscribe({
        next: (place) => {
          this.place = place;

          if (!this.isLoggedIn() || fetchedUserId === null) {
            this.isBookable = false;
          } else {
            this.isBookable =
              String(this.place.userId) !== String(fetchedUserId) &&
              this.place.avaiableTo! > new Date();
          }

          const imgs = (this.place.imageUrls && this.place.imageUrls.length > 0)
            ? this.place.imageUrls
            : (this.place.imageUrl ? [this.place.imageUrl] : []);

          this.place.imageUrls = imgs;
          this.selectedIndex = 0;
          this.selectedImageUrl = imgs[0] || this.place.imageUrl || '';

          this.isLoading = false;
        },
        error: (err) => {
          console.log('getPlace error', err);
          this.isLoading = false;
        }
      });
    });
  }

  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  getImageUrl(path?: string) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return 'http://localhost:8080' + path;
  }

  selectImage(index: number) {
    if (!this.place.imageUrls || index < 0 || index >= this.place.imageUrls.length) return;
    this.selectedIndex = index;
    this.selectedImageUrl = this.place.imageUrls[index];
  }

  getLowestRoomPrice(): number {
    if (!this.place?.rooms || this.place.rooms.length === 0) {
      return 0;
    }

    return Math.min(...this.place.rooms.map(room => Number(room.price || 0)));
  }

  onBookPlace() {
    this.actionSheetCtrl.create({
      header: 'Choose an Action',
      buttons: [
        {
          text: 'Select Date and Room',
          handler: () => {
            this.openBookingModal();
          }
        },
        {
          text: 'Cancel',
          role: 'destructive'
        }
      ]
    }).then(actionSheetEl => {
      actionSheetEl.present();
    });
  }

  openBookingModal() {
    this.modalController.create({
      component: CreateBookingComponent,
      componentProps: { selectedPlace: this.place }
    })
      .then(modalEl => {
        modalEl.present();
        return modalEl.onDidDismiss();
      })
      .then(resultData => {
        if (resultData.role === 'confirm') {
          this.loadingCtrl.create({
            message: 'Booking place...'
          }).then(loadingEl => {
            loadingEl.present();

            const data = resultData.data.bookingData;

            this.bookingService.addBooking(
              this.place.id!,
              this.place.title!,
              this.place.imageUrl!,
              data.roomid,
              data.roomType,
              data.priceAtBooking,
              data.firstName,
              data.lastName,
              data.bookedFrom,
              data.bookedTo
            ).subscribe({
              next: () => loadingEl.dismiss(),
              error: () => loadingEl.dismiss()
            });
          });
        }
      });
  }
}