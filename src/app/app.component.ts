import { Component } from '@angular/core';
import * as firebase from 'firebase';
import 'hammerjs';

import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'msu-root',
  styleUrls: ['./app.component.scss'],
  templateUrl: './app.component.html',
})
export class AppComponent {
  public constructor(
    public afAuth: AngularFireAuth,
  ) {
  }

  public login(): void {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  public logout(): void {
    this.afAuth.auth.signOut();
  }
}
