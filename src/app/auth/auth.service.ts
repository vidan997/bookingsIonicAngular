import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, tap } from 'rxjs';
import { User } from './user.model';

export interface AuthResponseData {
  id: number;
  email: string;
  token: string;
  tokenExperationDate: number;
  firstName: string;
  lastName: string;
  phone: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _user = new BehaviorSubject<User>(null as any);

  constructor(private http: HttpClient) {}

  get userId() {
    return this._user.asObservable().pipe(map(user => (user ? user.id : null as any)));
  }

  get userIsAuthenticated() {
    return this._user.asObservable().pipe(map(user => !!(user && user.token)));
  }

  get userToken() {
    return this._user.asObservable().pipe(map(user => (user ? user.token : null as any)));
  }

  signup(firstName: string, lastName: string, email: string, password: string, phone: string) {
    return this.http
      .post<AuthResponseData>('http://localhost:8080/user/signup', {
        firstName,
        lastName,
        email,
        password,
        phone
      })
      .pipe(tap(this.setUserData.bind(this)));
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponseData>('http://localhost:8080/user/signin', { email, password })
      .pipe(tap(this.setUserData.bind(this)));
  }

  autoLogin() {
    const userData = sessionStorage.getItem('userData');
    if (!userData) return;

    const parsed = JSON.parse(userData) as {
      id: number;
      email: string;
      token: string;
      tokenExpirationDate: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    };

    const expirationDate = new Date(parsed.tokenExpirationDate);

    if (!parsed.token || expirationDate <= new Date()) {
      sessionStorage.removeItem('userData');
      this._user.next(null as any);
      return;
    }

    const user = new User(
      parsed.id,
      parsed.email,
      parsed.token,
      expirationDate,
      parsed.firstName || '',
      parsed.lastName || '',
      parsed.phone || ''
    );

    this._user.next(user);
  }

  private setUserData(userData: AuthResponseData) {
    const expirationTime = new Date(
      new Date().getTime() + (+userData.tokenExperationDate * 1000)
    );

    const user = new User(
      userData.id,
      userData.email,
      userData.token,
      expirationTime,
      userData.firstName || '',
      userData.lastName || '',
      userData.phone || ''
    );

    this._user.next(user);

    sessionStorage.setItem(
      'userData',
      JSON.stringify({
        id: user.id,
        email: user.email,
        token: user.token,
        tokenExpirationDate: expirationTime.toISOString(),
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
      })
    );
  }

  isLoggedIn(): boolean {
    const user = this._user.getValue();
    return !!(user && user.token);
  }

  logout() {
    this._user.next(null as any);
    sessionStorage.removeItem('userData');
  }
}
