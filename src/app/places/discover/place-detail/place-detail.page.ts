import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController, LoadingController, ModalController, NavController } from '@ionic/angular';
import { PlacesService } from '../../places.service';
import { Place } from '../../place.model';
import { CreateBookingComponent } from 'src/app/bookings/create-booking/create-booking.component';
import { Subscription, switchMap } from 'rxjs';
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

  constructor(private navCtrl: NavController,
    private route: ActivatedRoute,
    private placesService: PlacesService,
    private modalController: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private bookingService: BookingService,
    private loadingCtrl: LoadingController,
    private authService: AuthService,
    private alertCtrl: AlertController,
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
      let fetchedUserId: string;
      this.authService.userId.pipe(switchMap(userId => {
        if (!userId) {
          throw new Error('Found no user!');
        }
        fetchedUserId = userId;
        return this.placesService.getPlace(paramMap.get('placeId')!)
      })).subscribe(place => {
        this.place = place;
        this.isBookable = (place.userId !== fetchedUserId && place.availableTo! > new Date());
        this.isLoading = false;
      }, error => {
        this.alertCtrl.create({
          header: 'An error ocuured!',
          message: 'Place could not be fetched. Please try again later.',
          buttons: [{
            text: 'Okay', handler: () => {
              this.router.navigate(['places/tabs/discover']);
            }
          }]
        })
          .then(alertEl => {
            alertEl.present();
          });
      });
    });
  }

  onBookPlace() {
    this.actionSheetCtrl.create({
      header: 'Choose an Action',
      buttons: [{
        text: 'Select Date',
        handler: () => {
          this.openBookingModal();
        }
      }, {
        text: 'Cancel',
        role: 'destructive'
      }]
    }).then(actionSheetEl => {
      actionSheetEl.present();
    });

  }

  openBookingModal() {
    console.log();


    this.modalController.create({
      component: CreateBookingComponent,
      componentProps: { selectedPlace: this.place }
    }).
      then(modalEl => {
        modalEl.present();
        return modalEl.onDidDismiss();
      }).
      then(resultData => {
        console.log(resultData.data, resultData.role);
        if (resultData.role === 'confirm') {
          this.loadingCtrl.create({
            message: 'Booking place...'
          }).then(loadginEl => {
            loadginEl.present();
            const data = resultData.data.bookingData;
            this.bookingService.addBooking(this.place.id!, this.place.title!, this.place.imageUrl!, data.firstName, data.lastName, data.questNumber, data.startDate, data.endDate)
              .subscribe(() => {
                loadginEl.dismiss();
              });
            console.log('Booked!');
          });

        }
      });
  }
}
