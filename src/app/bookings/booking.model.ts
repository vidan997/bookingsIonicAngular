export class Booking {
  constructor(
    public id: string,
    public placeId: string,
    public roomid: number,
    public userId: string,
    public placeTitle: string,
    public placeImage: string,
    public firstName: string,
    public lastName: string,
    public bookedFrom: Date,
    public bookedTo: Date,
    public roomType: string,
    public priceAtBooking: number,
    public ownerPhone?: string
  ) {}
}
  