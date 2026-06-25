import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-places',
  templateUrl: './places.page.html',
  styleUrls: ['./places.page.scss'],
})
export class PlacesPage implements OnInit, OnDestroy {
  isAuthenticated = false;
  private authSub?: Subscription;

  constructor(public authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.authSub = this.authService.userIsAuthenticated.subscribe(isAuth => {
      this.isAuthenticated = isAuth;
    });
  }

  isLoggedIn() {
    return this.isAuthenticated;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigateByUrl('/places/tabs/discover');
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }
}