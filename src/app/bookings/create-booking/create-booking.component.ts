import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Place } from 'src/app/places/place.model';

@Component({
  selector: 'app-create-booking',
  templateUrl: './create-booking.component.html',
  styleUrls: ['./create-booking.component.scss'],
})
export class CreateBookingComponent implements OnInit {

  @Input() selectedPlace!: Place;
  @ViewChild('f', { static: true }) form!: NgForm;
  startDate!: string;
  endDate!: string;
  constructor(private modalCtrl: ModalController) { }

  ngOnInit() {
    const startDateArray = this.selectedPlace?.avaiableFrom?.toISOString().split('T')!;
    this.startDate = startDateArray[0];
    const endDateArray = this.selectedPlace?.availableTo?.toISOString().split('T')!;
    this.endDate = endDateArray[0];
  }

  onCancel() {
    this.modalCtrl.dismiss();
  }

  onBookPlace() {
    if (!this.form.valid) {
      return;
    }

    this.modalCtrl.dismiss({
      bookingData: {
        firstName: this.form.value['first-name'],
        lastName: this.form.value['last-name'],
        questNumber: +this.form.value['quest-number'],
        startDate: new Date(this.form.value['datetime']),
        endDate: new Date(this.form.value['datetimeto'])
      }
    }, 'confirm');
  }

  datesValid() {
    const startDate = new Date(this.form.value['datetime']);
    const endDate = new Date(this.form.value['datetimeto']);
    return endDate > startDate;

  }



}
