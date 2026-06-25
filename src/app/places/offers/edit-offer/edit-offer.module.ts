import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditOfferPageRoutingModule } from './edit-offer-routing.module';

import { EditOfferPage } from './edit-offer.page';
import { OfferSeasonPricesComponent } from '../components/offer-season-prices/offer-season-prices.component';
import { OffersComponentsModule } from '../components/offers-components.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    EditOfferPageRoutingModule,
    OffersComponentsModule
  ],
  declarations: [EditOfferPage]
})
export class EditOfferPageModule {}
