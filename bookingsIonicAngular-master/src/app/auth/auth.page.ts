import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { LoadingController, AlertController } from '@ionic/angular';
import { AuthResponseData, AuthService } from './auth.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit, OnDestroy {

  isLogin = true;
  isLoading = false;

  private authSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {}

  ngOnDestroy(): void {
    if (this.authSub) this.authSub.unsubscribe();
  }

  onSwitchAuthMode() {
    this.isLogin = !this.isLogin;
  }

  onSubmit(form: NgForm) {
    if (!form.valid) return;

    const email = form.value.email;
    const password = form.value.password;

    const firstName = form.value.firstName;
    const lastName = form.value.lastName;
    const phone = form.value.phone;

    let authObs: Observable<AuthResponseData>;

    this.isLoading = true;

    this.loadingCtrl.create({ message: this.isLogin ? 'Logging in...' : 'Signing up...' })
      .then(loadingEl => {
        loadingEl.present();

        if (this.isLogin) {
          authObs = this.authService.login(email, password);
        } else {
          authObs = this.authService.signup(firstName, lastName, email, password, phone);
        }

        this.authSub = authObs.subscribe({
          next: () => {
            loadingEl.dismiss();
            this.isLoading = false;
            form.reset();
            this.router.navigateByUrl('/places/tabs/discover', { replaceUrl: true });
          },
          error: (err) => {
            loadingEl.dismiss();
            this.isLoading = false;

            const msg =
              (err?.error && typeof err.error === 'string') ? err.error :
              (err?.error?.message) ? err.error.message :
              'Authentication failed. Please try again.';

            this.alertCtrl.create({
              header: 'Authentication failed',
              message: msg,
              buttons: ['OK']
            }).then(a => a.present());
          }
        });
      });
  }

  onPhoneInput(ev: any) {
    const input = ev.target as HTMLIonInputElement;
    const value = (input.value ?? '').toString();
  
    const digitsOnly = value.replace(/\D+/g, '');
  
    const limited = digitsOnly.slice(0, 10);
  
    if (limited !== value) {
      input.value = limited;
    }
  }
  
}
