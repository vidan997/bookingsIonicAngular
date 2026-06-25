import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

type Season = {
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

type Room = {
  name: string;
  roomType: string;
  capacity: number;
  seasonPrices: Season[];
};

@Component({
  selector: 'app-offer-season-prices',
  templateUrl: './offer-season-prices.component.html',
  styleUrls: ['./offer-season-prices.component.scss'],
})
export class OfferSeasonPricesComponent implements OnInit {
  @Input() room!: Room;
  @Input() allowedFrom!: string;
  @Input() allowedTo!: string;

  editableRoom!: Room;

  draft: SeasonDraft = {
    seasonName: '',
    dateFrom: '',
    dateTo: '',
    pricePerNight: null
  };

  constructor(private modalCtrl: ModalController) {}

  ngOnInit(): void {
    this.editableRoom = JSON.parse(JSON.stringify(this.room));
  }

  addSeason(): void {
    if (!this.draft.seasonName || !this.draft.dateFrom || !this.draft.dateTo || !this.draft.pricePerNight) {
      return;
    }

    if (new Date(this.draft.dateFrom).getTime() > new Date(this.draft.dateTo).getTime()) {
      return;
    }

    this.editableRoom.seasonPrices.push({
      seasonName: this.draft.seasonName,
      dateFrom: this.extractDate(this.draft.dateFrom),
      dateTo: this.extractDate(this.draft.dateTo),
      pricePerNight: Number(this.draft.pricePerNight)
    });

    this.resetDraft();
  }

  removeSeason(index: number): void {
    this.editableRoom.seasonPrices.splice(index, 1);
  }

  save(): void {
    this.modalCtrl.dismiss(
      { room: this.editableRoom },
      'confirm'
    );
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  isOutOfRange(season: Season): boolean {
    if (!this.allowedFrom || !this.allowedTo) {
      return false;
    }

    return (
      new Date(season.dateFrom).getTime() < new Date(this.allowedFrom).getTime() ||
      new Date(season.dateTo).getTime() > new Date(this.allowedTo).getTime()
    );
  }

  private extractDate(value: string): string {
    return String(value).split('T')[0];
  }

  private resetDraft(): void {
    this.draft = {
      seasonName: '',
      dateFrom: '',
      dateTo: '',
      pricePerNight: null
    };
  }

  onInputChange(field: string, event: any) {
    const value = event?.detail?.value ?? event?.target?.value ?? '';
  
    if (field === 'seasonName') {
      this.draft.seasonName = value;
    }
  
    if (field === 'dateFrom') {
      this.draft.dateFrom = value;
    }
  
    if (field === 'dateTo') {
      this.draft.dateTo = value;
    }
  
    if (field === 'pricePerNight') {
      this.draft.pricePerNight = value ? Number(value) : null;
    }
  }
}