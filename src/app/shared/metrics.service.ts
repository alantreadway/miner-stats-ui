import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';

import { AngularFire2DatabaseAdaptor } from 'app/shared/angular-fire2';
import {
  Algorithm,
  ALL_ALGORITHMS,
  ALL_POOLS,
  Pool,
  PoolAlgoRecord,
  PoolAlgoRollupRecord,
  PoolProfitability,
} from 'app/shared/schema';
import { RigProfile } from 'app/shared/schema';
import { TimeseriesData, TimeseriesDataPoint } from 'app/shared/timeseries.interface';

export type TimeseriesDataWithKeys = TimeseriesData & {
  algo: string,
  pool: string,
};
export type PoolAlgoData = TimeseriesDataWithKeys & {
  mostRecent?: TimeseriesDataPoint,
};

interface ProfitabilityFilter { name: string; }

function convertMinuteData(
  multiplier: number,
): (data: PoolAlgoRecord) => TimeseriesDataPoint {
  return (r) => {
    return {
      name: new Date((r.timestamp || 0) * 1000),
      value: (r.amount.amount || 0) * (multiplier || 0),
    };
  };
}

function convertRollupData(
  multiplier: number,
): (data: PoolAlgoRollupRecord) => TimeseriesDataPoint {
  return (r) => {
    return {
      max: r.max.amount * multiplier,
      min: r.min.amount * multiplier,
      name: new Date((r.timestamp || 0) * 1000),
      value: (r.sum.amount / r.count) * multiplier,
    };
  };
}

@Injectable()
export class MetricsService {
  public constructor(
    private readonly db: AngularFire2DatabaseAdaptor,
  ) {}

  public getProfitabilityStats(
    filter: Observable<ProfitabilityFilter>,
    rigProfile: Observable<RigProfile>,
  ): {
    minuteData: Observable<PoolAlgoData[]>,
    hourData: Observable<PoolAlgoData[]>,
    dayData: Observable<PoolAlgoData[]>,
  } {
    return {
      // tslint:disable:object-literal-sort-keys
      minuteData: this.buildFilterChain(
        (p, a) => this.watchProfitability(p, a, 'per-minute', convertMinuteData, 120, rigProfile),
        filter,
        rigProfile,
      ),
      hourData: this.buildFilterChain(
        (p, a) => this.watchProfitability(p, a, 'per-hour', convertRollupData, 72, rigProfile),
        filter,
        rigProfile,
      ),
      dayData: this.buildFilterChain(
        (p, a) => this.watchProfitability(p, a, 'per-day', convertRollupData, 30, rigProfile),
        filter,
        rigProfile,
      ),
      // tslint:enable:object-literal-sort-keys
    };
  }

  private buildFilterChain<T extends PoolAlgoData>(
    source: (pool: Pool, algo: Algorithm, rigProfile: Observable<RigProfile>) => Observable<T>,
    filterSource: Observable<ProfitabilityFilter>,
    rigProfile: Observable<RigProfile>,
  ): Observable<T[]> {
    return Observable.combineLatest(
      ..._.flatten(
        ALL_POOLS.map((pool) => ALL_ALGORITHMS.map((algo) => source(pool, algo, rigProfile))),
      ),
    )
      .debounceTime(1000)
      .combineLatest(filterSource)
      .map(([results, filter]) => {
        return results.filter(
          (result) => {
            return (!filter.name || result.name.indexOf(filter.name) >= 0);
          },
        );
      })
      .publishReplay(1)
      .refCount();
  }

  private watchProfitability<
    K extends keyof PoolProfitability,
    Z extends keyof PoolProfitability[K],
    T extends PoolProfitability[K][Z]
  >(
    pool: Pool,
    algo: Algorithm,
    granularityKey: K,
    convertFn: (multiplier: number) => (data: T) => TimeseriesDataPoint,
    limit = 120,
    rigProfile: Observable<RigProfile>,
  ): Observable<PoolAlgoData> {
    let limitMinutes = limit;
    switch (granularityKey) {
      case 'per-day':
        limitMinutes = limit * 24 * 60;
        break;
      case 'per-hour':
        limitMinutes = limit * 60;
        break;
      default:
    }

    const listResult: Observable<T[]> = this.db.list(
      ['v2', 'pool', pool, algo, 'profitability', granularityKey],
      { limitToLast: limit, orderByPriority: true },
    );
    return listResult
      .combineLatest(
        rigProfile.map(p => convertFn(this.multiplier(pool, algo, p))),
      )
      .map(
        ([data, convertFnInstance]): PoolAlgoData => {
          const timeLimit = (Date.now() - limitMinutes * 60 * 1000);

          const mostRecent = data.reduce(
            (newest, next) => {
              if (newest.timestamp < next.timestamp) {
                return next;
              }
              return newest;
            },
            data[0],
          );

          return {
            algo,
            mostRecent: mostRecent != null ? convertFnInstance(mostRecent) : undefined,
            name: `${pool} - ${algo}`,
            pool,
            series: data
              .map(convertFnInstance)
              .filter(p => {
                if (typeof p.name === 'string') {
                  return true;
                }
                return p.name.getTime() > timeLimit;
              }),
          };
        },
    );
  }

  private multiplier(pool: Pool, algo: Algorithm, rigProfile: RigProfile): number {
    let spdDivisor = 1e6; // MH
    if (algo === 'blake2s' || algo === 'blakecoin') {
      spdDivisor = 1e9; // GH
    }
    if (algo === 'yescrypt') {
      spdDivisor = 1e3; // KH
    }
    return (((rigProfile[algo] || 0) * 1000) * 1000) / spdDivisor;
  }
}
