import { Injectable } from '@angular/core';
// import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';

import { AngularFire2DatabaseAdaptor } from 'app/shared/angular-fire2';
import {
  Algorithm,
  isCoinPoolCurrent,
  Pool,
  PoolAlgoRecord,
  PoolAlgoRollupRecord,
  PoolCurrent,
  PoolProfitability,
  validPathForList,
  ValidPathForList,
} from 'app/shared/schema';
import { RigProfile } from 'app/shared/schema';
import { TimeseriesData, TimeseriesDataPoint } from 'app/shared/timeseries.interface';
import { Dictionary } from 'lodash';

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
  private readonly profitabilityStats: Observable<PoolCurrent[]>;
  private readonly profitabilityTimeseriesCache: Dictionary<Observable<PoolAlgoData>>;

  public constructor(
    private readonly db: AngularFire2DatabaseAdaptor,
  ) {
    this.profitabilityStats = db.list(validPathForList(['v2', 'pool', 'latest']))
      .publishReplay(1)
      .refCount();

    this.profitabilityTimeseriesCache = {};
  }

  public getProfitabilityStats(
    filterSource: Observable<ProfitabilityFilter>,
    rigProfile: Observable<RigProfile>,
  ): Observable<PoolCurrent[]> {
    return this.profitabilityStats
      .combineLatest(filterSource, rigProfile)
      .map(([results, filter, profile]) => {
        return results
          .filter(
            (result) => {
              const name = `${result.pool} - ${result.algo}`.toLowerCase();
              const filterName = filter.name && filter.name.toLowerCase();
              return (!filterName || name.indexOf(filter.name) >= 0);
            },
          )
          .map(
            (result) => {
              const multipler = this.multiplier(result.pool, result.algo, profile);
              return {
                ...result,
                amount: {
                  ...result.amount,
                  amount: result.amount.amount * multipler,
                },
              };
            },
          );
      })
      .publishReplay(1)
      .refCount();
  }

  public getTimeSeriesProfitabilityStats(
    current: PoolCurrent,
    rigProfile: Observable<RigProfile>,
    granularity: keyof PoolProfitability,
  ): Observable<PoolAlgoData> {
    let cacheKey = `${current.pool} - ${current.algo} - ${granularity}`;
    if (isCoinPoolCurrent(current)) {
      cacheKey = `${current.pool} - ${current.coin} - ${granularity}`;
    }
    if (this.profitabilityTimeseriesCache[cacheKey] == null) {
      switch (granularity) {
        default:
        case 'per-minute':
          this.profitabilityTimeseriesCache[cacheKey] = this.watchProfitability(
            current,
            granularity,
            convertMinuteData,
            120,
            rigProfile,
          )
            .publishReplay(1)
            .refCount();
          break;
        case 'per-hour':
          this.profitabilityTimeseriesCache[cacheKey] = this.watchProfitability(
            current,
            granularity,
            convertRollupData,
            72,
            rigProfile,
          )
            .publishReplay(1)
            .refCount();
          break;
        case 'per-day':
          this.profitabilityTimeseriesCache[cacheKey] = this.watchProfitability(
            current,
            granularity,
            convertRollupData,
            30,
            rigProfile,
          )
            .publishReplay(1)
            .refCount();
          break;
      }
    }

    return this.profitabilityTimeseriesCache[cacheKey];
  }

  private watchProfitability<
    K extends keyof PoolProfitability,
    Z extends keyof PoolProfitability[K],
    T extends PoolProfitability[K][Z]
  >(
    p: PoolCurrent,
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

    const listKey: ValidPathForList<T> = isCoinPoolCurrent(p) ?
      validPathForList([
        'v2', 'pool', 'coin', p.pool, p.coin, p.algo, 'profitability', granularityKey,
      ]) :
      validPathForList([
        'v2', 'pool', 'algo', p.pool, p.algo, 'profitability', granularityKey,
      ]);

    const listResult = this.db.list(
      listKey,
      { limitToLast: limit, orderByPriority: true },
    );
    return listResult
      .combineLatest(
        rigProfile.map(profile => convertFn(this.multiplier(p.pool, p.algo, profile))),
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
            algo: p.algo,
            mostRecent: mostRecent != null ? convertFnInstance(mostRecent) : undefined,
            name: `${p.pool} - ${p.algo}`,
            pool: p.pool,
            series: data
              .map(convertFnInstance)
              .filter(point => {
                if (typeof point.name === 'string') {
                  return true;
                }
                return point.name.getTime() > timeLimit;
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
    return ((rigProfile.hashrates[algo] || 0) * 1000000) / spdDivisor;
  }
}
