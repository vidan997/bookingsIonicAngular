export class Place {
    constructor(
        public id?: string | undefined,
        public title?: string | undefined,
        public description?: string | undefined,
        public imageUrl?: string | undefined,
        public price?: number | undefined,
        public avaiableFrom?: Date | undefined,
        public avaiableTo?: Date | undefined,
        public userMail?: string |undefined) {
    }
}