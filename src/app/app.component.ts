import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material';
import * as firebase from 'firebase';
import 'hammerjs';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { AngularFireAuth } from 'angularfire2/auth';
import { ContextService } from 'app/shared/context.service';
import { RigProfilesService } from 'app/shared/rig-profiles.service';
import { ALL_ALGORITHMS, ALL_POOLS, RigProfile } from 'app/shared/schema';
import { Subscription } from 'rxjs/Subscription';

const SORTED_FILTER_NAMES = [
  ...ALL_ALGORITHMS,
  ...ALL_POOLS,
  ..._.flatten(ALL_POOLS.map(p => ALL_ALGORITHMS.map(a => `${p} - ${a}`))),
]
  .sort();

@Component({
  selector: 'msu-root',
  styleUrls: ['./app.component.scss'],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnDestroy {
  public readonly filterForm: FormGroup;
  public readonly filterNameOptions: Observable<string[]>;

  public readonly rigProfilesAvailable: Observable<{ [uuid: string]: RigProfile }>;
  public readonly rigProfileUuid: Subject<string> = new Subject<string>();

  public readonly keys: typeof Object.keys = Object.keys;

  public readonly subscriptions: Subscription[] = [];

  public constructor(
    private readonly rigProfiles: RigProfilesService,
    private readonly context: ContextService,
    public afAuth: AngularFireAuth,
  ) {
    this.rigProfilesAvailable = this.rigProfiles.getRigProfiles();
    this.rigProfiles.getDefaultRigProfile()
      .first()
      .subscribe((defaultProfile) => {
        if (defaultProfile != null) {
          this.rigProfileUuid.next(defaultProfile);
        }
      });
    this.subscriptions.push(
      this.rigProfilesAvailable
        .combineLatest(this.rigProfileUuid)
        .map(([profiles, selected]) => profiles[selected])
        .subscribe((profile) => this.context.updateRigProfile(profile)),
    );

    this.filterForm = new FormGroup({
      name: new FormControl(''),
    });
    this.subscriptions.push(
      this.filterForm.valueChanges
        .startWith({ name: '' })
        .map((form) => form.name ? form.name : null)
        .subscribe((filter) => this.context.updateFilter(filter)),
    );

    this.filterNameOptions = Observable.of(SORTED_FILTER_NAMES)
      .combineLatest(this.filterForm.valueChanges.startWith({}))
      .map(([names, form]) => {
        return form.name ?
          names.filter(n => n.indexOf(form.name) >= 0) :
          names;
      });
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  public rigProfileSelected(event: MatSelectChange): void {
    this.rigProfileUuid.next(event.value);
  }

  public clearFilter(event: Event): void {
    event.stopPropagation();

    this.filterForm.setValue({name: ''});
  }

  public login(): void {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  public logout(): void {
    this.afAuth.auth.signOut();
  }
}
