import { Injectable } from '@angular/core';
import { Place } from './place.model';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private places: Place[] = [
    new Place(
      'p1',
      'Vikendica na Zlatiboru',
      'Sa pogledom na planine.',
      'https://cf.bstatic.com/xdata/images/hotel/max1024x768/271649742.jpg?k=ab00ae5f8ce8cc3cc148a4a6cab701a5d7bb3141d6079f76aab077a21324d200&o=&hp=1',
      149.99,
      new Date('2019-01-01'),
      new Date('2019-12-01')),
    new Place(
      'p2',
      'Kopaonik',
      'Hotel sa 4 zvezdice',
      'https://cf.bstatic.com/xdata/images/hotel/max1024x768/408555873.jpg?k=d2047f0d573371fc42bc560bffb9de042b19219dda5eedf577a2a0ed8888ac23&o=&hp=1',
      99.99,
      new Date('2019-01-01'),
      new Date('2019-12-01')),
    new Place(
      'p3',
      'Divcibare',
      'Za Divčibare vikendice predstavljaju prave male oaze mira, vikendice na Divčibarama su mesto gde možete uživati u svakom trenutku vašeg odmora i napuniti baterije za naredne radne dane. Ko traži vikendice Divčibare je planina na kojoj ih ima u izobilju privatni smeštaj u vikendicama na Divčibarama je veoma popularan vid turizma širom Divčibara. Ako i vama treba ove zime za Divčibare smeštaj vikendica ima dovoljno da prime sve ljubitelje zimskih čarolija, koji su rešili da svoje dane odmora provedu u ovom predivnom kraju, a vikendice na Divčibarama jedva čekaju svoje nove stanare, nove posetioce da stvore svoje uspomene.',
      'https://www.divcibare.org.rs/wp-content/uploads/2021/11/vikendica-bajka-izdvojena.jpg',
      99.99,
      new Date('2019-01-01'),
      new Date('2019-12-01'))
  ];

  get getPlaces() {
    return [...this.places];

  }
  getPlace(id: string | null){
    return {...this.places.find(p=>p.id==id)}
  }

  constructor() { }
}