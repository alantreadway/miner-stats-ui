import { Injectable } from '@angular/core';
import { Reference } from '@firebase/database';
import { Query } from '@firebase/database-types';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';

import { Schema } from 'app/shared/schema';

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

  public list<
    A extends keyof Schema,
    Z extends keyof Schema[A],
    R extends Schema[A][Z]
  >(
    path: [A],
    options?: ListOptions,
  ): Observable<R[]>;
  public list<
    A extends keyof Schema,
    B extends keyof Schema[A],
    Z extends keyof Schema[A][B],
    R extends Schema[A][B][Z]
  >(
    path: [A, B],
    options?: ListOptions,
  ): Observable<R[]>;
  public list<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    Z extends keyof Schema[A][B][C],
    R extends Schema[A][B][C][Z]
  >(
    path: [A, B, C],
    options?: ListOptions,
  ): Observable<R[]>;
  public list<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    Z extends keyof Schema[A][B][C][D],
    R extends Schema[A][B][C][D][Z]
  >(
    path: [A, B, C, D],
    options?: ListOptions,
  ): Observable<R[]>;
  public list<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    E extends keyof Schema[A][B][C][D],
    Z extends keyof Schema[A][B][C][D][E],
    R extends Schema[A][B][C][D][E][Z]
  >(
    path: [A, B, C, D, E],
    options?: ListOptions,
  ): Observable<R[]>;
  public list<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    E extends keyof Schema[A][B][C][D],
    F extends keyof Schema[A][B][C][D][E],
    Z extends keyof Schema[A][B][C][D][E][F],
    R extends Schema[A][B][C][D][E][F][Z]
  >(
    path: [A, B, C, D, E, F],
    options?: ListOptions,
  ): Observable<R[]>;
  public list<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    E extends keyof Schema[A][B][C][D],
    F extends keyof Schema[A][B][C][D][E],
    G extends keyof Schema[A][B][C][D][E][F],
    Z extends keyof Schema[A][B][C][D][E][F][G],
    R extends Schema[A][B][C][D][E][F][G][Z]
  >(
    path: [A, B, C, D, E, F, G],
    options?: ListOptions,
  ): Observable<R[]>;
  public list<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    E extends keyof Schema[A][B][C][D],
    F extends keyof Schema[A][B][C][D][E],
    G extends keyof Schema[A][B][C][D][E][F],
    H extends keyof Schema[A][B][C][D][E][F][G],
    Z extends keyof Schema[A][B][C][D][E][F][G][H],
    R extends Schema[A][B][C][D][E][F][G][H][Z]
  >(
    path: [A, B, C, D, E, F, G, H],
    options?: ListOptions,
  ): Observable<R[]>;
  public list<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    E extends keyof Schema[A][B][C][D],
    F extends keyof Schema[A][B][C][D][E],
    G extends keyof Schema[A][B][C][D][E][F],
    H extends keyof Schema[A][B][C][D][E][F][G],
    I extends keyof Schema[A][B][C][D][E][F][G][H],
    Z extends keyof Schema[A][B][C][D][E][F][G][H][I],
    R extends Schema[A][B][C][D][E][F][G][H][I][Z]
  >(
    path: [A, B, C, D, E, F, G, H, I],
    options?: ListOptions,
  ): Observable<R[]>;
  public list<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    E extends keyof Schema[A][B][C][D],
    F extends keyof Schema[A][B][C][D][E],
    G extends keyof Schema[A][B][C][D][E][F],
    H extends keyof Schema[A][B][C][D][E][F][G],
    I extends keyof Schema[A][B][C][D][E][F][G][H],
    J extends keyof Schema[A][B][C][D][E][F][G][H][I],
    Z extends keyof Schema[A][B][C][D][E][F][G][H][I][J],
    R extends Schema[A][B][C][D][E][F][G][H][I][J][Z]
  >(
    path: [A, B, C, D, E, F, G, H, I, J],
    options?: ListOptions,
  ): Observable<R[]>;
  public list(path: string[], options: ListOptions = {}): Observable<{}[]> {
    return this.db.list(
      path.join('/'),
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

  public object<
    A extends keyof Schema,
    R extends Schema[A]
  >(
    path: [A],
    options?: ObjectOptions,
  ): Observable<R | null>;
  public object<
    A extends keyof Schema,
    B extends keyof Schema[A],
    R extends Schema[A][B]
  >(
    path: [A, B],
    options?: ObjectOptions,
  ): Observable<R | null>;
  public object<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    R extends Schema[A][B][C]
  >(
    path: [A, B, C],
    options?: ObjectOptions,
  ): Observable<R | null>;
  public object<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    R extends Schema[A][B][C][D]
  >(
    path: [A, B, C, D],
    options?: ObjectOptions,
  ): Observable<R | null>;
  public object<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    E extends keyof Schema[A][B][C][D],
    R extends Schema[A][B][C][D][E]
  >(
    path: [A, B, C, D, E],
    options?: ObjectOptions,
  ): Observable<R | null>;
  public object<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    E extends keyof Schema[A][B][C][D],
    F extends keyof Schema[A][B][C][D][E],
    R extends Schema[A][B][C][D][E][F]
  >(
    path: [A, B, C, D, E, F],
    options?: ObjectOptions,
  ): Observable<R | null>;
  public object<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    E extends keyof Schema[A][B][C][D],
    F extends keyof Schema[A][B][C][D][E],
    G extends keyof Schema[A][B][C][D][E][F],
    R extends Schema[A][B][C][D][E][F][G]
  >(
    path: [A, B, C, D, E, F, G],
    options?: ObjectOptions,
  ): Observable<R | null>;
  public object<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    E extends keyof Schema[A][B][C][D],
    F extends keyof Schema[A][B][C][D][E],
    G extends keyof Schema[A][B][C][D][E][F],
    H extends keyof Schema[A][B][C][D][E][F][G],
    R extends Schema[A][B][C][D][E][F][G][H]
  >(
    path: [A, B, C, D, E, F, G, H],
    options?: ObjectOptions,
  ): Observable<R | null>;
  public object<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    E extends keyof Schema[A][B][C][D],
    F extends keyof Schema[A][B][C][D][E],
    G extends keyof Schema[A][B][C][D][E][F],
    H extends keyof Schema[A][B][C][D][E][F][G],
    I extends keyof Schema[A][B][C][D][E][F][G][H],
    R extends Schema[A][B][C][D][E][F][G][H][I]
  >(
    path: [A, B, C, D, E, F, G, H, I],
    options?: ObjectOptions,
  ): Observable<R | null>;
  public object<
    A extends keyof Schema,
    B extends keyof Schema[A],
    C extends keyof Schema[A][B],
    D extends keyof Schema[A][B][C],
    E extends keyof Schema[A][B][C][D],
    F extends keyof Schema[A][B][C][D][E],
    G extends keyof Schema[A][B][C][D][E][F],
    H extends keyof Schema[A][B][C][D][E][F][G],
    I extends keyof Schema[A][B][C][D][E][F][G][H],
    J extends keyof Schema[A][B][C][D][E][F][G][H][I],
    R extends Schema[A][B][C][D][E][F][G][H][I][J]
  >(
    path: [A, B, C, D, E, F, G, H, I, J],
    options?: ObjectOptions,
  ): Observable<R | null>;
  public object(path: string[], options: ObjectOptions = {}): Observable<{} | null> {
    return this.db.object(path.join('/'))
      .valueChanges();
  }
}
