import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AlertController,
  LoadingController,
  ModalController,
  NavController
} from '@ionic/angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Place } from '../../place.model';
import { PlacesService } from '../../places.service';
import { OfferSeasonPricesComponent } from '../components/offer-season-prices/offer-season-prices.component';

type EditableSeasonPrice = {
  id?: number | null;
  roomId?: number | null;
  seasonName: string;
  dateFrom: string;
  dateTo: string;
  pricePerNight: number;
};

type EditableRoom = {
  id?: number | null;
  placeid?: number | null;
  name: string;
  roomType: string;
  capacity: number;
  seasonPrices: EditableSeasonPrice[];
};

@Component({
  selector: 'app-edit-offer',
  templateUrl: './edit-offer.page.html',
  styleUrls: ['./edit-offer.page.scss'],
})
export class EditOfferPage implements OnInit, OnDestroy {
  placeId!: string;
  place!: Place;

  form!: FormGroup;
  isLoading = false;

  existingImages: string[] = [];
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];

  coverIndex = 0;

  rooms: EditableRoom[] = [];

  newRoomName = '';
  newRoomType = 'Single';
  newRoomCapacity: number | null = 1;

  roomTypes: string[] = [
    'Single',
    'Double',
    'Triple',
    'Apartment',
    'Studio',
    'Suite'
  ];

  private placeSub!: Subscription;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private route: ActivatedRoute,
    private placesService: PlacesService,
    private navCtrl: NavController,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private modalController: ModalController
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/offers');
        return;
      }

      this.placeId = paramMap.get('placeId')!;
      this.isLoading = true;

      this.placeSub = this.placesService.getPlace(this.placeId).subscribe({
        next: place => {
          this.place = place;

          this.form = new FormGroup({
            title: new FormControl(this.place.title, {
              updateOn: 'blur',
              validators: [Validators.required]
            }),
            description: new FormControl(this.place.description, {
              updateOn: 'blur',
              validators: [Validators.required, Validators.maxLength(100)]
            })
          });

          this.existingImages =
            this.place.imageUrls && this.place.imageUrls.length > 0
              ? [...this.place.imageUrls]
              : this.place.imageUrl
              ? [this.place.imageUrl]
              : [];

          const coverUrl = this.place.imageUrl || this.existingImages[0] || '';
          const idx = this.existingImages.indexOf(coverUrl);
          this.coverIndex = idx >= 0 ? idx : 0;

          this.selectedFiles = [];
          this.imagePreviews = this.existingImages.map(path => this.getImageUrl(path));

          if (this.imagePreviews.length === 0) {
            this.coverIndex = 0;
          }

          this.rooms = this.place.rooms
            ? this.place.rooms.map(room => ({
                id: room.id,
                placeid: room.placeid,
                name: room.name || '',
                roomType: room.roomType || 'Single',
                capacity: Number(room.capacity || 1),
                seasonPrices: room.seasonPrices
                  ? room.seasonPrices.map(sp => ({
                      id: sp.id,
                      roomId: sp.roomId,
                      seasonName: sp.seasonName || '',
                      dateFrom: this.extractDateOnly(sp.dateFrom),
                      dateTo: this.extractDateOnly(sp.dateTo),
                      pricePerNight: Number(sp.pricePerNight || 0)
                    }))
                  : []
              }))
            : [];

          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.alertCtrl.create({
            header: 'An error occurred!',
            message: 'Place could not be fetched. Please try again later.',
            buttons: [{
              text: 'Okay',
              handler: () => this.router.navigateByUrl('/places/tabs/offers')
            }]
          }).then(a => a.present());
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.placeSub) {
      this.placeSub.unsubscribe();
    }
  }

  getImageUrl(path?: string): string {
    if (!path) return '';
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http')) return path;
    return 'http://localhost:8080' + path;
  }

  getPlaceDateFrom(): string {
    return this.extractDateOnly((this.place as any)?.avaiableFrom || (this.place as any)?.availableFrom);
  }

  getPlaceDateTo(): string {
    return this.extractDateOnly((this.place as any)?.avaiableTo || (this.place as any)?.availableTo);
  }

  openFilePicker(): void {
    this.fileInput?.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);

    files.forEach(file => {
      this.selectedFiles.push(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviews.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  setCover(index: number): void {
    this.coverIndex = index;
  }

  removeImage(index: number): void {
    if (this.imagePreviews.length <= 1) {
      this.showAlert('You must keep at least one image.');
      return;
    }

    if (index < this.existingImages.length) {
      this.existingImages.splice(index, 1);
    } else {
      const newIndex = index - this.existingImages.length;
      this.selectedFiles.splice(newIndex, 1);
    }

    this.imagePreviews.splice(index, 1);

    if (this.coverIndex === index) {
      this.coverIndex = 0;
    } else if (this.coverIndex > index) {
      this.coverIndex--;
    }
  }

  onRoomNameChange(index: number, event: any): void {
    this.rooms[index].name = event?.detail?.value || '';
  }

  onRoomTypeChange(index: number, event: any): void {
    this.rooms[index].roomType = event?.detail?.value || '';
  }

  onRoomCapacityChange(index: number, event: any): void {
    const value = Number(event?.detail?.value);
    this.rooms[index].capacity = isNaN(value) || value < 1 ? 1 : value;
  }

  onNewRoomNameChange(event: any): void {
    this.newRoomName = event?.detail?.value || '';
  }

  onNewRoomTypeChange(event: any): void {
    this.newRoomType = event?.detail?.value || '';
  }

  onNewRoomCapacityChange(event: any): void {
    const value = Number(event?.detail?.value);
    this.newRoomCapacity = isNaN(value) || value < 1 ? 1 : value;
  }

  addRoom(): void {
    const name = this.newRoomName.trim();
    const roomType = this.newRoomType.trim();
    const capacity = Number(this.newRoomCapacity);

    if (!name || !roomType || !capacity || capacity < 1) {
      this.showAlert('Please enter valid room name, room type and capacity.');
      return;
    }

    this.rooms.push({
      name,
      roomType,
      capacity,
      seasonPrices: []
    });

    this.newRoomName = '';
    this.newRoomType = 'Single';
    this.newRoomCapacity = 1;
  }

  removeRoom(index: number): void {
    if (this.rooms.length <= 1) {
      this.showAlert('Must have at least 1 room.');
      return;
    }

    this.rooms.splice(index, 1);
  }

  openSeasonPricesModal(room: EditableRoom, roomIndex: number): void {
    const allowedFrom = this.getPlaceDateFrom();
    const allowedTo = this.getPlaceDateTo();

    if (!allowedFrom || !allowedTo) {
      this.showAlert('Offer date range is missing, so season prices cannot be edited yet.');
      return;
    }

    const roomCopy: EditableRoom = JSON.parse(JSON.stringify(room));

    this.modalController.create({
      component: OfferSeasonPricesComponent,
      componentProps: {
        room: roomCopy,
        allowedFrom,
        allowedTo
      },
      cssClass: 'season-prices-modal'
    })
      .then(modalEl => {
        modalEl.present();
        return modalEl.onDidDismiss();
      })
      .then(resultData => {
        if (resultData.role === 'confirm' && resultData.data?.room) {
          this.rooms[roomIndex] = resultData.data.room;
        }
      });
  }

  roomHasOutOfRangeSeason(room: EditableRoom): boolean {
    const allowedFrom = this.getPlaceDateFrom();
    const allowedTo = this.getPlaceDateTo();

    if (!allowedFrom || !allowedTo) {
      return false;
    }

    const allowedFromTime = new Date(allowedFrom).getTime();
    const allowedToTime = new Date(allowedTo).getTime();

    return room.seasonPrices.some(season => {
      const seasonFrom = new Date(this.extractDateOnly(season.dateFrom)).getTime();
      const seasonTo = new Date(this.extractDateOnly(season.dateTo)).getTime();

      return seasonFrom < allowedFromTime || seasonTo > allowedToTime;
    });
  }

  onUpdateOffer(): void {
    if (!this.form?.valid) {
      return;
    }

    if (this.existingImages.length + this.selectedFiles.length === 0) {
      this.showAlert('Please keep at least one image.');
      return;
    }

    if (this.rooms.length === 0) {
      this.showAlert('Please keep at least one room.');
      return;
    }

    const roomWithoutSeason = this.rooms.find(room => room.seasonPrices.length === 0);
    if (roomWithoutSeason) {
      this.showAlert('Every room must have at least one season price.');
      return;
    }

    const invalidRoom = this.rooms.find(room => this.roomHasOutOfRangeSeason(room));
    if (invalidRoom) {
      this.showAlert('Some season prices are outside the allowed offer date range.');
      return;
    }

    this.loadingCtrl.create({ message: 'Updating place...' }).then(loadingEl => {
      loadingEl.present();

      this.placesService.updatePlaceMultipart(
        this.placeId,
        this.form.value.title,
        this.form.value.description,
        this.existingImages,
        this.selectedFiles,
        this.coverIndex,
        this.rooms
      ).subscribe({
        next: () => {
          loadingEl.dismiss();
          this.router.navigateByUrl('/places/tabs/offers');
        },
        error: err => {
          loadingEl.dismiss();
          console.log('updatePlaceMultipart error', err);
          this.showAlert('Could not update offer. Check console for details.');
        }
      });
    });
  }

  private extractDateOnly(value: any): string {
    if (!value) {
      return '';
    }
    return String(value).split('T')[0];
  }

  private showAlert(message: string): void {
    this.alertCtrl.create({
      header: 'Warning',
      message,
      buttons: ['OK']
    }).then(alertEl => alertEl.present());
  }
}