import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PlacesService } from '../../places.service';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-new-offer',
  templateUrl: './new-offer.page.html',
  styleUrls: ['./new-offer.page.scss'],
})
export class NewOfferPage implements OnInit {

  form: FormGroup = new FormGroup({});
  startDate!: string;

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  coverIndex = 0;

  rooms: { roomType: string; price: number; quantity: number }[] = [];
  customRoomType = '';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private placesService: PlacesService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    const startDateArray = new Date().toISOString().split('T');
    this.startDate = startDateArray[0];

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
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      dateTo: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      roomType: new FormControl(null),
      roomPrice: new FormControl(null),
      roomQuantity: new FormControl(1)
    });
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.selectedFiles = Array.from(input.files);
    this.imagePreviews = [];
    this.coverIndex = 0;

    this.selectedFiles.forEach(file => {
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

  setCover(index: number) {
    this.coverIndex = index;
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);

    if (this.coverIndex === index) {
      this.coverIndex = 0;
    } else if (this.coverIndex > index) {
      this.coverIndex--;
    }

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onCustomRoomTypeChange(event: any) {
    this.customRoomType = event?.detail?.value || '';
  }

  addRoom() {
    const selectedRoomType = this.form.value.roomType;
    const roomType = this.customRoomType?.trim() || selectedRoomType;
    const roomPrice = Number(this.form.value.roomPrice);
    const roomQuantity = Number(this.form.value.roomQuantity);

    if (!roomType || !roomPrice || roomPrice < 1 || !roomQuantity || roomQuantity < 1) {
      this.showAlert('Please enter valid room type, price and quantity.');
      return;
    }

    this.rooms.push({
      roomType: roomType,
      price: roomPrice,
      quantity: roomQuantity
    });

    this.form.patchValue({
      roomType: null,
      roomPrice: null,
      roomQuantity: 1
    });

    this.customRoomType = '';
  }

  removeRoom(index: number) {
    this.rooms.splice(index, 1);
  }

  onCreateOffer() {
    if (!this.form.valid) return;

    if (this.selectedFiles.length === 0) {
      this.showAlert('Please select at least one image.');
      return;
    }

    if (this.rooms.length === 0) {
      this.showAlert('Please add at least one room.');
      return;
    }

    this.loadingCtrl.create({ message: 'Creating place...' }).then(loadingEl => {
      loadingEl.present();

      this.placesService.addPlaceMultipart(
        this.form.value.title,
        this.form.value.description,
        new Date(this.form.value.dateFrom),
        new Date(this.form.value.dateTo),
        this.selectedFiles,
        this.coverIndex,
        this.rooms
      ).subscribe({
        next: () => {
          loadingEl.dismiss();
          this.router.navigateByUrl('places/tabs/offers');
        },
        error: (errRes) => {
          loadingEl.dismiss();
          const message = errRes?.error || 'Upload failed.';
          this.showAlert(message);
        }
      });
    });
  }

  private showAlert(message: string) {
    this.alertCtrl.create({
      header: 'Failed!',
      message,
      buttons: ['Okay']
    }).then(alertEl => alertEl.present());
  }
  
}