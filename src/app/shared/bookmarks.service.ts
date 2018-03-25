import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { User } from 'firebase';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';

import { AngularFire2DatabaseAdaptor } from 'app/shared/angular-fire2';
import {
  UserProfile,
  validPath,
  validPathForList,
} from 'app/shared/schema';

const EMPTY_BOOKMARKS: UserProfile['bookmarks'] = {
  pools: {},
};

@Injectable()
export class BookmarksService {
  private readonly userId: Observable<string>;
  private readonly userBookmarks: Observable<UserProfile['bookmarks']>;

  public constructor(
    private readonly db: AngularFire2DatabaseAdaptor,
    private readonly auth: AngularFireAuth,
  ) {
    this.userId = this.auth.authState
      .filter((user): user is User => user != null)
      .map(user => user.uid)
      .publishReplay(1)
      .refCount();

    this.userBookmarks = this.userId
      .switchMap(
        (uid) => this.db.object(validPath(['v2', 'user', uid, 'bookmarks'])),
      )
      .map(resultOrNull => resultOrNull ? resultOrNull : EMPTY_BOOKMARKS)
      .publishReplay(1)
      .refCount();
  }

  public getPoolCoinsOrAlgos(): Observable<UserProfile['bookmarks']['pools'][''][]> {
    return this.userBookmarks.map((bookmarks) => _.values(bookmarks.pools));
  }

  public addPoolCoinsOrAlgos(newBookmark: UserProfile['bookmarks']['pools'][0]): Observable<void> {
    return this.userId
      .first()
      .switchMap(
        (uid) => {
          const path = validPathForList(['v2', 'user', uid, 'bookmarks', 'pools']);
          return Observable.fromPromise(
            // tslint:disable-next-line:no-any
            this.db.insertObject(path, newBookmark as any),
          );
        },
      );
  }

  public removePoolCoinsOrAlgos(
    bookmark: UserProfile['bookmarks']['pools'][''],
  ): Observable<void> {
    return this.userId
      .combineLatest(this.userBookmarks)
      .first()
      .switchMap(
        ([uid, bookmarks]) => {
          const index = Object.keys(bookmarks.pools)
            .find(key => bookmarks.pools[key] === bookmark);

          if (index == null) {
            throw new Error('Can\'t find bookmark to remove');
          }

          const path = validPath(['v2', 'user', uid, 'bookmarks', 'pools', index]);
          return Observable.fromPromise(
            this.db.removeObject(path),
          );
        },
    );
  }
}
