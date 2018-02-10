import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase } from 'angularfire2/database';
import { User } from 'firebase';
import { Observable } from 'rxjs/Observable';

import { AngularFire2DatabaseAdaptor } from 'app/shared/angular-fire2';
import { RigProfile } from 'app/shared/schema';

@Injectable()
export class RigProfilesService {
  private readonly userId: Observable<string>;
  private readonly rigProfiles: Observable<{ [uuid: string ]: RigProfile }>;

  public constructor(
    private readonly db: AngularFire2DatabaseAdaptor,
    private readonly auth: AngularFireAuth,
  ) {
    this.userId = this.auth.authState
      .filter((user): user is User => user != null)
      .map(user => user.uid)
      .publishReplay(1)
      .refCount();

    this.rigProfiles = this.userId
      .switchMap(
        (uid) => Observable.combineLatest(
          this.db.object(['v2', 'user', uid, 'rig-profile']),
          this.db.object(['v2', 'rig-profile']),
        ),
      )
      .map(([userProfiles, globalProfiles]) => {
        return {
          ...globalProfiles,
          ...userProfiles,
        };
      })
      .publishReplay(1)
      .refCount();
  }

  public getRigProfiles(): Observable<{ [uuid: string]: RigProfile }> {
    return this.rigProfiles;
  }

  public getRigProfile(profileUuid: string): Observable<RigProfile | null> {
    return this.userId.switchMap(
      (uid) => this.db.object(['v2', 'user', uid, 'rig-profile', profileUuid])
        .switchMap(
          (profile) => profile != null ?
            Observable.of(profile) :
            // If the RigProfile isn't found in the users set of profiles, fallback to globally
            // defined rig profiles.
            this.db.object(['v2', 'rig-profile', profileUuid]),
      ),
    );
  }

  public getDefaultRigProfile(): Observable<string | null> {
    return this.userId
      .switchMap(
        (uid) => this.db
          .object(['v2', 'user', uid, 'defaults', 'rig-profile'], {}),
      );
  }
}
