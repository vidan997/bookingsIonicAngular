export class Place {
    constructor(
        public id?: string | undefined,
        public title?: string | undefined,
        public description?: string | undefined,
        public imageUrl?: string | undefined,
        public price?: number | undefined,
        public avaiableFrom?: Date | undefined,
        public availableTo?: Date | undefined,
        public userId?: string |undefined) {
    }
}