import { Room } from "./offers/room.model";

export class Place {
  constructor(
    public id?: string,
    public title?: string,
    public description?: string,
    public imageUrl?: string,
    public imageUrls: string[] = [],
    public avaiableFrom?: Date,
    public avaiableTo?: Date,
    public userId?: number,
    public rooms: Room[] = []
  ) {}
}