import { Component, Input, OnInit } from '@angular/core';
import { Place } from '../../place.model';

@Component({
  selector: 'app-offer-item',
  templateUrl: './offer-item.component.html',
  styleUrls: ['./offer-item.component.scss'],
})
export class OfferItemComponent implements OnInit {

  @Input() offer!: Place;

  ngOnInit() {}

  getCoverImageUrl() {
    const cover = (this.offer?.imageUrls && this.offer.imageUrls.length > 0)
      ? this.offer.imageUrls[0]
      : (this.offer?.imageUrl || '');

    if (!cover) return '';
    if (cover.startsWith('http')) return cover;
    return 'http://localhost:8080' + cover;
  }
}
