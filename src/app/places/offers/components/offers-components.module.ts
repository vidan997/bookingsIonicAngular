import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { OfferSeasonPricesComponent } from './offer-season-prices/offer-season-prices.component';

@NgModule({
  declarations: [OfferSeasonPricesComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  exports: [OfferSeasonPricesComponent]
})
export class OffersComponentsModule {}