import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Place } from '../../place.model';
import { PlacesService } from '../../places.service';

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

  rooms: { id?: number; placeid?: number; roomType: string; price: number; quantity: number }[] = [];
  newRoomType = '';
  newRoomPrice: number | null = null;
  newRoomQuantity = 1;

  private placeSub!: Subscription;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private route: ActivatedRoute,
    private placesService: PlacesService,
    private navCtrl: NavController,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(paramMap => {
      if (!paramMap.has('placeId')) {
        this.navCtrl.navigateBack('/places/tabs/offers');
        return;
      }

      this.placeId = paramMap.get('placeId')!;
      this.isLoading = true;

      this.placeSub = this.placesService.getPlace(this.placeId).subscribe({
        next: (place) => {
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

          this.existingImages = (this.place.imageUrls && this.place.imageUrls.length > 0)
            ? [...this.place.imageUrls]
            : (this.place.imageUrl ? [this.place.imageUrl] : []);

          const coverUrl = this.place.imageUrl || this.existingImages[0] || '';
          const idx = this.existingImages.indexOf(coverUrl);
          this.coverIndex = idx >= 0 ? idx : 0;

          this.selectedFiles = [];
          this.imagePreviews = this.existingImages.map(p => this.getImageUrl(p));

          if (this.imagePreviews.length === 0) {
            this.coverIndex = 0;
          }

          this.rooms = this.place.rooms
            ? this.place.rooms.map(room => ({
                id: room.id,
                placeid: room.placeid,
                roomType: room.roomType || '',
                price: Number(room.price || 0),
                quantity: Number(room.quantity || 1)
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

  getImageUrl(path?: string) {
    if (!path) return '';
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http')) return path;
    return 'http://localhost:8080' + path;
  }

  openFilePicker() {
    this.fileInput?.nativeElement.click();
  }

  onFilesSelected(event: Event) {
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

  setCover(index: number) {
    this.coverIndex = index;
  }

  removeImage(index: number) {
    if (this.imagePreviews.length <= 1) {
      this.alertCtrl.create({
        header: 'Not allowed',
        message: 'You must keep at least one image.',
        buttons: ['Okay']
      }).then(a => a.present());
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

  onRoomPriceChange(index: number, event: any) {
    const value = Number(event?.detail?.value);
    this.rooms[index].price = isNaN(value) ? 0 : value;
  }

  onRoomQuantityChange(index: number, event: any) {
    const value = Number(event?.detail?.value);
    this.rooms[index].quantity = isNaN(value) ? 1 : value;
  }

  onNewRoomTypeChange(event: any) {
    this.newRoomType = event?.detail?.value || '';
  }

  onNewRoomPriceChange(event: any) {
    const value = Number(event?.detail?.value);
    this.newRoomPrice = isNaN(value) ? null : value;
  }

  onNewRoomQuantityChange(event: any) {
    const value = Number(event?.detail?.value);
    this.newRoomQuantity = isNaN(value) ? 1 : value;
  }

  addRoom() {
    const roomType = this.newRoomType.trim();
    const price = Number(this.newRoomPrice);
    const quantity = Number(this.newRoomQuantity);

    if (!roomType || !price || price < 1 || !quantity || quantity < 1) {
      this.alertCtrl.create({
        header: 'Failed!',
        message: 'Please enter valid room type, price and quantity.',
        buttons: ['Okay']
      }).then(a => a.present());
      return;
    }

    this.rooms.push({
      roomType,
      price,
      quantity
    });

    this.newRoomType = '';
    this.newRoomPrice = null;
    this.newRoomQuantity = 1;
  }

  removeRoom(index: number) {
    if (this.rooms.length <= 1) {
      this.alertCtrl.create({
        header: 'Failed!',
        message: 'Must have at least 1 room.',
        buttons: ['Okay']
      }).then(alertEl => alertEl.present());
      return;
    }
  
    this.rooms.splice(index, 1);
  }

  onUpdateOffer() {
    if (!this.form?.valid) return;

    if (this.existingImages.length + this.selectedFiles.length === 0) {
      this.alertCtrl.create({
        header: 'Failed!',
        message: 'Please keep at least one image.',
        buttons: ['Okay']
      }).then(a => a.present());
      return;
    }

    if (this.rooms.length === 0) {
      this.alertCtrl.create({
        header: 'Failed!',
        message: 'Please keep at least one room.',
        buttons: ['Okay']
      }).then(a => a.present());
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
        error: (err) => {
          loadingEl.dismiss();
          console.log('updatePlaceMultipart error', err);

          this.alertCtrl.create({
            header: 'Update failed',
            message: 'Could not update offer. Check console for details.',
            buttons: ['Okay']
          }).then(a => a.present());
        }
      });
    });
  }
}