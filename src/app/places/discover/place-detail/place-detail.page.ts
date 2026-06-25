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
  ) {}

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
              !!this.place.avaiableTo &&
              this.place.avaiableTo > new Date();
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

  getLowestRoomPrice(): number | null {
    if (!this.place?.rooms || this.place.rooms.length === 0) {
      return null;
    }

    const allPrices: number[] = [];

    this.place.rooms.forEach(room => {
      if (room.seasonPrices && room.seasonPrices.length > 0) {
        room.seasonPrices.forEach(season => {
          const price = Number(season.pricePerNight);
          if (!isNaN(price) && price > 0) {
            allPrices.push(price);
          }
        });
      }
    });

    if (allPrices.length === 0) {
      return null;
    }

    return Math.min(...allPrices);
  }

  getRoomTypesText(): string {
    if (!this.place?.rooms || this.place.rooms.length === 0) {
      return '';
    }

    const uniqueTypes = [...new Set(
      this.place.rooms
        .map(room => room.roomType)
        .filter(type => !!type)
    )];

    return uniqueTypes.join(', ');
  }

  getRoomsCount(): number {
    return this.place?.rooms ? this.place.rooms.length : 0;
  }

  onSelectRoomType(roomType: string) {
    if (!this.isLoggedIn() || !this.isBookable) {
      return;
    }
  
    this.openBookingModal(roomType);
  }
  
  openBookingModal(roomType: string) {
    this.modalController.create({
      component: CreateBookingComponent,
      componentProps: {
        selectedPlace: this.place,
        selectedRoomType: roomType
      },
      cssClass: 'booking-modal-wide'
    })
      .then(modalEl => {
        modalEl.present();
        return modalEl.onDidDismiss();
      })
      .then(resultData => {
        if (resultData.role === 'confirm') {
          this.bookingService.fetchBookings().pipe(take(1)).subscribe();
        }
      });
  }

  getUniqueRoomTypes(): string[] {
    if (!this.place?.rooms || this.place.rooms.length === 0) {
      return [];
    }
  
    return [...new Set(
      this.place.rooms
        .map(room => room.roomType)
        .filter(type => !!type)
    )];
  }
  
  getLowestPriceForRoomType(roomType: string): number | null {
    if (!this.place?.rooms || this.place.rooms.length === 0) {
      return null;
    }
  
    const prices: number[] = [];
  
    this.place.rooms
      .filter(room => room.roomType === roomType)
      .forEach(room => {
        if (room.seasonPrices && room.seasonPrices.length > 0) {
          room.seasonPrices.forEach(season => {
            const price = Number(season.pricePerNight);
            if (!isNaN(price) && price > 0) {
              prices.push(price);
            }
          });
        }
      });
  
    if (prices.length === 0) {
      return null;
    }
  
    return Math.min(...prices);
  }

  private getTodayDateOnly(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  
  private getPriceForSeasonDate(season: any, targetDate: Date): number | null {
    const rawFrom = season?.dateFrom ?? season?.fromDate ?? season?.startDate ?? season?.from;
    const rawTo = season?.dateTo ?? season?.toDate ?? season?.endDate ?? season?.to;
    const rawPrice = season?.pricePerNight ?? season?.price ?? null;
  
    if (!rawFrom || !rawTo || rawPrice === null || rawPrice === undefined) {
      return null;
    }
  
    const from = new Date(rawFrom);
    const to = new Date(rawTo);
  
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);
  
    if (targetDate >= from && targetDate <= to) {
      const price = Number(rawPrice);
      return isNaN(price) ? null : price;
    }
  
    return null;
  }
  
  getCurrentRoomPrice(): number | null {
    if (!this.place?.rooms || this.place.rooms.length === 0) {
      return null;
    }
  
    const today = this.getTodayDateOnly();
    const prices: number[] = [];
  
    this.place.rooms.forEach((room: any) => {
      if (room.seasonPrices?.length) {
        room.seasonPrices.forEach((season: any) => {
          const price = this.getPriceForSeasonDate(season, today);
          if (price !== null && price > 0) {
            prices.push(price);
          }
        });
      }
    });
  
    if (prices.length === 0) {
      return null;
    }
  
    return Math.min(...prices);
  }
  
  getCurrentPriceForRoomType(roomType: string): number | null {
    if (!this.place?.rooms || this.place.rooms.length === 0) {
      return null;
    }
  
    const today = this.getTodayDateOnly();
    const prices: number[] = [];
  
    this.place.rooms
      .filter((room: any) => String(room.roomType).trim().toLowerCase() === String(roomType).trim().toLowerCase())
      .forEach((room: any) => {
        if (room.seasonPrices?.length) {
          room.seasonPrices.forEach((season: any) => {
            const price = this.getPriceForSeasonDate(season, today);
            if (price !== null && price > 0) {
              prices.push(price);
            }
          });
        }
      });
  
    if (prices.length === 0) {
      return null;
    }
  
    return Math.min(...prices);
  }

  
}