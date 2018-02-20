import { Injectable } from '@angular/core';
import { Reference } from '@firebase/database';
import { Query } from '@firebase/database-types';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';

import { ValidPath, ValidPathForList } from 'app/shared/schema';

interface ListOptions {
  limitToLast?: number;
  orderByPriority?: boolean;
}

// tslint:disable-next-line:no-empty-interface
interface ObjectOptions {
  // For future extension.
}

@Injectable()
export class AngularFire2DatabaseAdaptor {
  public constructor(
    private readonly db: AngularFireDatabase,
  ) {}

  public list<T>(key: ValidPathForList<T>, options: ListOptions = {}): Observable<T[]> {
    return this.db.list<T>(
      key.path.join('/'),
      (ref) => {
        let result: Query | Reference = ref;
        if (options.orderByPriority) {
          result = result.orderByPriority();
        }
        if (options.limitToLast) {
          result = result.limitToLast(options.limitToLast);
        }
        return result;
      },
    )
      .valueChanges();
  }

  public object<T>(key: ValidPath<T>, options: ObjectOptions = {}): Observable<T | null> {
    return this.db.object<T>(key.path.join('/'))
      .valueChanges();
  }

  public setObject<T>(key: ValidPath<T>, value: T): Promise<void> {
    return this.db.database.ref(key.path.join('/'))
      .set(value);
  }
}
