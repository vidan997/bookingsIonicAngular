import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

interface AuthResponseData{
  idToken: string;
  email: string;
  refreshToken: string;
  localId: string;
  expiresIn: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _userIsAuthenticated = false;
  private _userId = 'xyz';

  get userId() {
    return this._userId;
  }

  get userIsAuthenticated() {
    return this._userIsAuthenticated;
  }

  constructor(private http: HttpClient) { }

  signup(email: string, password: string) {
    return this.http.post<AuthResponseData>(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${environment.firebaseAPIkey}`,
      { email: email, password: password, returnSecureToken: true });
  }


  login() {
    this._userIsAuthenticated = true;
  }

  logout() {
    this._userIsAuthenticated = false;
  }
}
