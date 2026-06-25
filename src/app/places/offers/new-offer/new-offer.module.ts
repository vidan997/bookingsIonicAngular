import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NewOfferPageRoutingModule } from './new-offer-routing.module';

import { NewOfferPage } from './new-offer.page';
import { OfferSeasonPricesComponent } from '../components/offer-season-prices/offer-season-prices.component';
import { OffersComponentsModule } from '../components/offers-components.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    NewOfferPageRoutingModule,
    OffersComponentsModule
  ],
  declarations: [NewOfferPage]
})
export class NewOfferPageModule { }
