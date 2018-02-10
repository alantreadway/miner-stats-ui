import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase } from 'angularfire2/database';
import { User } from 'firebase';
import { Observable } from 'rxjs/Observable';

import { AngularFire2DatabaseAdaptor } from 'app/shared/angular-fire2';
import { RigProfile } from 'app/shared/schema';

@Injectable()
export class RigProfilesService {
  public constructor(
    private readonly db: AngularFire2DatabaseAdaptor,
    private readonly auth: AngularFireAuth,
  ) {
  }

  public getDefaultRigProfile(): Observable<RigProfile> {
    return this.auth.authState
      .filter((user): user is User => user != null)
      .switchMap(
        (user) => this.db
          .object(['v2', 'user', user.uid, 'defaults', 'rig-profile'], {}),
        (user, profile) => [user.uid, profile],
      )
      .filter((tuple): tuple is [string, string] => typeof tuple[1] === 'string')
      .switchMap(
        ([uid, profile]) => this.db.object(['v2', 'user', uid, 'rig-profile', profile]),
      )
      .filter((profile): profile is RigProfile => profile != null);
  }
}
