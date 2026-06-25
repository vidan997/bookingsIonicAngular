export class RoomSeasonPrice {
    constructor(
      public id: number | null,
      public roomId: number | null,
      public seasonName: string,
      public dateFrom: string,
      public dateTo: string,
      public pricePerNight: number
    ) {}
  }