import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PlacesService } from '../../places.service';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';

function base64toBlob(base64Data: string, contentType: string) {
  contentType = contentType || '';
  const sliceSize = 1024;
  const byteCharacters = atob(base64Data);
  const bytesLength = byteCharacters.length;
  const slicesCount = Math.ceil(bytesLength / sliceSize);
  const byteArrays = new Array(slicesCount);

  for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    const begin = sliceIndex * sliceSize;
    const end = Math.min(begin + sliceSize, bytesLength);

    const bytes = new Array(end - begin);
    for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}

@Component({
  selector: 'app-new-offer',
  templateUrl: './new-offer.page.html',
  styleUrls: ['./new-offer.page.scss'],
})
export class NewOfferPage implements OnInit {

  form: FormGroup = new FormGroup({});;
  startDate!: string;

  constructor(private placesService: PlacesService, private router: Router, private loadingCtrl: LoadingController, private alertCtrl: AlertController) { }

  ngOnInit() {
    const startDateArray = new Date().toISOString().split('T')!;
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
      price: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required, Validators.min(1)]
      }),
      dateFrom: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      dateTo: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      }),
      imageurl: new FormControl(null, {
        updateOn: 'blur',
        validators: [Validators.required]
      })
    });
  }

  onCreateOffer() {
    console.log(this.form);
    if (!this.form.valid) {
      return;
    }
    console.log(this.form.value);
    this.loadingCtrl.create({
      message: 'Creating place...'
    }).then(loadingEl => {
      loadingEl.present();
      this.placesService.addPlace(
        this.form.value.title,
        this.form.value.description,
        +this.form.value.price,
        new Date(this.form.value.dateFrom),
        new Date(this.form.value.dateTo),
        this.form.value.imageurl).subscribe(() => {
          this.router.navigateByUrl('places/tabs/offers');
          loadingEl.dismiss();
        }, errRes => {
          loadingEl.dismiss();
          let message = errRes.error;
          
          this.showAlert(message);
        });
    });
  }

  private showAlert(message: string) {
    this.alertCtrl.create(
      {
        header: 'Failed!',
        message: message,
        buttons: ['Okay']
      }
    ).then(alertEl => {
      alertEl.present();
    })
  }


  /* onImagePicked(imageData: string | File) {
     let imageFile;
     if (typeof imageData === 'string') {
       try {
         imageFile = base64toBlob(imageData.replace('data:image/jpeg;base64', ''), 'image/jpeg');
       } catch (error) {
         console.log(error);
         return;
       }
     }
     else {
       imageFile = imageData;
     }
 
     //this.form.patchValue({ image: imageFile });
   }*/

}
