import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import * as _ from 'lodash';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/publishReplay';
import 'rxjs/add/operator/startWith';
import { Observable } from 'rxjs/Observable';

import { ALGORITHMS, POOLS, RIG_PROFILE } from 'app/shared/configurations';
import {
  PoolAlgoProfitabilityRecord,
  PoolAlgoProfitabilityRollupRecord,
} from 'app/shared/firebase.interface';
import { TimeseriesData } from 'app/shared/timeseries.interface';

export type TimeseriesDataWithKeys = TimeseriesData & { algo: string, pool: string };

interface ProfitabilityFilter { name: string; }

function convertMinuteData(
  multiplier: number,
): (data: PoolAlgoProfitabilityRecord) => TimeseriesData['series'][0] {
  return (r) => {
    return {
      name: new Date((r.timestamp || 0) * 1000),
      value: (r.amount.amount || 0) * (multiplier || 0),
    };
  };
}

function convertRollupData(
  multiplier: number,
): (data: PoolAlgoProfitabilityRollupRecord) => TimeseriesData['series'][0] {
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
    private readonly db: AngularFireDatabase,
  ) {}

  public getProfitabilityStats(
    filter: Observable<ProfitabilityFilter>,
  ): {
    minuteData: Observable<TimeseriesDataWithKeys[]>,
    hourData: Observable<TimeseriesDataWithKeys[]>,
    dayData: Observable<TimeseriesDataWithKeys[]>,
  } {
    return {
      // tslint:disable:object-literal-sort-keys
      minuteData: this.buildFilterChain(
        (p, a) => this.watchProfitability(p, a, 'minute', convertMinuteData, 120),
        filter,
      ),
      hourData: this.buildFilterChain(
        (p, a) => this.watchProfitability(p, a, 'hour', convertRollupData, 72),
        filter,
      ),
      dayData: this.buildFilterChain(
        (p, a) => this.watchProfitability(p, a, 'day', convertRollupData, 30),
        filter,
      ),
      // tslint:enable:object-literal-sort-keys
    };
  }

  private buildFilterChain<T extends TimeseriesDataWithKeys>(
    source: (pool: string, algo: string) => Observable<T>,
    filterSource: Observable<ProfitabilityFilter>,
  ): Observable<T[]> {
    return Observable.combineLatest(
      ..._.flatten(
        POOLS.map((pool) => ALGORITHMS.map((algo) => source(pool, algo))),
      ),
    )
      .debounceTime(1000)
      .combineLatest(filterSource)
      .map(([results, filter]) => {
        return results.filter(
          (result) => {
            return result.series.length > 0 &&
              (!filter.name || result.name.indexOf(filter.name) >= 0);
          },
        );
      })
      .publishReplay(1)
      .refCount();
  }

  private watchProfitability<
    T extends PoolAlgoProfitabilityRecord | PoolAlgoProfitabilityRollupRecord
    >(
      pool: string,
      algo: string,
      granularity: 'day' | 'minute' | 'hour',
      convertFn: (multiplier: number) => (data: T) => TimeseriesDataWithKeys['series'][0],
      limit = 120,
  ): Observable<TimeseriesDataWithKeys> {
    let limitMinutes = limit;
    switch (granularity) {
      case 'day':
        limitMinutes = limit * 24 * 60;
        break;
      case 'hour':
        limitMinutes = limit * 60;
        break;
      default:
    }

    const multiplier = this.multiplier(pool, algo);

    return this.db.list<T>(
      `/v2/pool/${pool}/${algo}/profitability/per-${granularity}`,
      (query) => query.orderByPriority()
        .limitToLast(limit),
    )
      .valueChanges()
      .map(
        (data): TimeseriesDataWithKeys => {
          const timeLimit = (Date.now() - limitMinutes * 60 * 1000);

          return {
            algo,
            name: `${pool} - ${algo}`,
            pool,
            series: data.map(convertFn(multiplier))
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

  private multiplier(pool: string, algo: string): number {
    let spdDivisor = 1e6; // MH
    if (algo === 'blake2s' || algo === 'blakecoin') {
      spdDivisor = 1e9; // GH
    }
    if (algo === 'yescrypt') {
      spdDivisor = 1e3; // KH
    }
    return (((RIG_PROFILE[algo] * 1000) || 0) * 1000) / spdDivisor;
  }
}
