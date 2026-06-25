import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { PlacesService } from '../../places.service';
import { OfferSeasonPricesComponent } from '../components/offer-season-prices/offer-season-prices.component';

type NewSeasonPrice = {
  seasonName: string;
  dateFrom: string;
  dateTo: string;
  pricePerNight: number;
};

type SeasonDraft = {
  seasonName: string;
  dateFrom: string;
  dateTo: string;
  pricePerNight: number | null;
};

type NewRoom = {
  name: string;
  roomType: string;
  capacity: number;
  seasonPrices: NewSeasonPrice[];
  seasonDraft: SeasonDraft;
};

@Component({
  selector: 'app-new-offer',
  templateUrl: './new-offer.page.html',
  styleUrls: ['./new-offer.page.scss'],
})
export class NewOfferPage implements OnInit {
  form: FormGroup = new FormGroup({});
  startDate = '';

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  coverIndex = 0;

  rooms: NewRoom[] = [];

  roomTypes: string[] = [
    'Single',
    'Double',
    'Triple',
    'Apartment',
    'Studio',
    'Suite'
  ];

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private placesService: PlacesService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private modalController: ModalController
  ) {}

  ngOnInit(): void {
    this.startDate = new Date().toISOString().split('T')[0];

    this.form = new FormGroup({
      title: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      description: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.maxLength(100)]
      }),
      dateFrom: new FormControl(null, {
        validators: [Validators.required]
      }),
      dateTo: new FormControl(null, {
        validators: [Validators.required]
      }),
      roomName: new FormControl(null),
      roomType: new FormControl('Single'),
      roomCapacity: new FormControl(1)
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);

    files.forEach(file => {
      this.selectedFiles.push(file);

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviews.push(reader.result as string);
      };
      reader.readAsDataURL(file);
    });

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  setCover(index: number): void {
    this.coverIndex = index;
  }

  removeImage(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);

    if (this.imagePreviews.length === 0) {
      this.coverIndex = 0;
    } else if (this.coverIndex === index) {
      this.coverIndex = 0;
    } else if (this.coverIndex > index) {
      this.coverIndex--;
    }

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  addRoom(): void {
    const roomName = (this.form.value.roomName || '').trim();
    const roomType = (this.form.value.roomType || '').trim();
    const roomCapacity = Number(this.form.value.roomCapacity);

    if (!roomName || !roomType || !roomCapacity || roomCapacity < 1) {
      this.showAlert('Please enter valid room name, room type and capacity.');
      return;
    }

    this.rooms.push({
      name: roomName,
      roomType,
      capacity: roomCapacity,
      seasonPrices: [],
      seasonDraft: {
        seasonName: '',
        dateFrom: '',
        dateTo: '',
        pricePerNight: null
      }
    });

    this.form.patchValue({
      roomName: null,
      roomType: 'Single',
      roomCapacity: 1
    });
  }

  removeRoom(index: number): void {
    this.rooms.splice(index, 1);
  }

  openSeasonPricesModal(room: NewRoom, roomIndex: number): void {
    const allowedFrom = this.getPlaceDateFrom();
    const allowedTo = this.getPlaceDateTo();

    if (!allowedFrom || !allowedTo) {
      this.showAlert('Please select available from and available to dates first.');
      return;
    }

    const roomCopy: NewRoom = JSON.parse(JSON.stringify(room));

    this.modalController.create({
      component: OfferSeasonPricesComponent,
      componentProps: {
        room: roomCopy,
        roomIndex,
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

  getPlaceDateFrom(): string {
    return this.extractDateOnly(this.form.value.dateFrom);
  }

  getPlaceDateTo(): string {
    return this.extractDateOnly(this.form.value.dateTo);
  }

  getMinDateTo(): string {
    return this.getPlaceDateFrom() || this.startDate;
  }

  roomHasOutOfRangeSeason(room: NewRoom): boolean {
    const allowedFrom = this.getPlaceDateFrom();
    const allowedTo = this.getPlaceDateTo();

    if (!allowedFrom || !allowedTo) {
      return false;
    }

    const allowedFromTime = new Date(allowedFrom).getTime();
    const allowedToTime = new Date(allowedTo).getTime();

    return room.seasonPrices.some(season => {
      const seasonFrom = new Date(season.dateFrom).getTime();
      const seasonTo = new Date(season.dateTo).getTime();

      return seasonFrom < allowedFromTime || seasonTo > allowedToTime;
    });
  }

  onCreateOffer(): void {
    if (!this.form.valid) {
      this.showAlert('Please fill in all required offer fields.');
      return;
    }

    const placeDateFrom = this.getPlaceDateFrom();
    const placeDateTo = this.getPlaceDateTo();

    if (!placeDateFrom || !placeDateTo) {
      this.showAlert('Please select available from and available to dates.');
      return;
    }

    if (new Date(placeDateFrom).getTime() > new Date(placeDateTo).getTime()) {
      this.showAlert('"Available from" must be earlier than or equal to "available to".');
      return;
    }

    if (this.selectedFiles.length === 0) {
      this.showAlert('Please select at least one image.');
      return;
    }

    if (this.rooms.length === 0) {
      this.showAlert('Please add at least one room.');
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

    const payloadRooms = this.rooms.map(room => ({
      name: room.name,
      roomType: room.roomType,
      capacity: room.capacity,
      seasonPrices: room.seasonPrices
    }));

    this.loadingCtrl.create({ message: 'Creating offer...' }).then(loadingEl => {
      loadingEl.present();

      this.placesService.addPlaceMultipart(
        this.form.value.title,
        this.form.value.description,
        new Date(placeDateFrom),
        new Date(placeDateTo),
        this.selectedFiles,
        this.coverIndex,
        payloadRooms
      ).subscribe({
        next: () => {
          loadingEl.dismiss();
          this.router.navigateByUrl('/places/tabs/offers');
        },
        error: (errRes) => {
          loadingEl.dismiss();
          const message = errRes?.error || 'Upload failed.';
          this.showAlert(message);
        }
      });
    });
  }

  private extractDateOnly(value: string | null | undefined): string {
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