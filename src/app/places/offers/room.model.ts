import { RoomSeasonPrice } from './room-season-price.model';

export class Room {
  constructor(
    public id: number | null,
    public placeid: number | null,
    public name: string,
    public roomType: string,
    public capacity: number,
    public seasonPrices: RoomSeasonPrice[]
  ) {}
}