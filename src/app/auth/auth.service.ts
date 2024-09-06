import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from './user.model';

export interface AuthResponseData {
  email: string;
  id: string;
  token: string;
  tokenExperationDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _user = new BehaviorSubject<User>(null!);

  get userMail() {
    return this._user.asObservable().pipe(map(user => {
      if (user) {
        return user.id;
      } else {
        return null!;
      }
    }));
  }

  get userIsAuthenticated() {
    return this._user.asObservable().pipe(map(user => {
      if (user) {
        return !!user.token;
      } else {
        return false;
      }
    }));
  }

  get userToken() {
    return this._user.asObservable().pipe(map(user => {
      if (user) {
        return user.token;
      } else {
        return null!;
      }
    }))
  }

  constructor(private http: HttpClient) { }

  signup(email: string, password: string) {
    return this.http.post<AuthResponseData>(`http://localhost:8080/user/signup`,
      { email: email, password: password })
      .pipe(tap(this.setUserData.bind(this)));
  }


  login(email: string, password: string) {
    return this.http.post<AuthResponseData>(`http://localhost:8080/user/signin`,
      { email: email, password: password })
      .pipe(tap(this.setUserData.bind(this)));
  }

  logout() {
    this._user.next(null!);
  }

  private setUserData(userData: AuthResponseData) {
    const expirationTime = new Date(new Date().getTime() + (+userData.tokenExperationDate * 1000));
    this._user.next(new User(
      userData.id,
      userData.email,
      userData.token,
      expirationTime
    ));
  }
}
