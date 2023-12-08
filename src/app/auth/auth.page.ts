import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  isLoading = false;
  isLogin = true;

  constructor(private authService: AuthService, private router: Router, private loadingCtrl: LoadingController, private alertCtrl: AlertController) { }

  ngOnInit() {
  }

  authenticate(email: string, password: string) {
    this.authService.login();
    this.isLoading = true;
    this.loadingCtrl.create({ keyboardClose: true, message: 'Logging in...' })
      .then(loadingEl => {
        loadingEl.present();
        this.authService.signup(email, password).subscribe(resData => {
          console.log(resData);
          this.isLoading = false;
          loadingEl.dismiss();
          this.router.navigateByUrl('/places/tabs/discover');
        }, errRes => {
          loadingEl.dismiss();
          const code = errRes.error.error.message;
          let message = 'Could not sign you up,please try again.'
          if (code === 'EMAIL_EXISTS') {
            message='This email adress already exists!';
          }
          this.showAlert(message);
        });
      });
  }

  private showAlert(message: string) {
    this.alertCtrl.create(
      {
        header: 'Authentication failed',
        message: message,
        buttons: ['Okay']
      }
    ).then(alertEl => {
      alertEl.present();
    })
  }

  onSubmit(form: NgForm) {
    console.log(form);
    if (!form.valid) {
      return;
    }
    const email = form.value.email;
    const password = form.value.password;

    this.authenticate(email, password);

  }

  onSwitchAuthMode() {
    this.isLogin = !this.isLogin;

  }
}
