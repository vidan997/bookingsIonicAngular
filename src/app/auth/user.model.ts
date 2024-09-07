export class User {
    constructor(public id: number, public email: string, private _token: string, private tokenExpirationDate: Date) { }

    get token() {
        if (!this.tokenExpirationDate || this.tokenExpirationDate <= new Date()) {
            return null;
        }
        return this._token;
    }
}