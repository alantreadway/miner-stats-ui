import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AngularFireDatabase } from 'angularfire2/database';
import * as _ from 'lodash';
import * as moment from 'moment';
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
import { Dictionary } from 'lodash';

type TimeseriesDataWithKeys = TimeseriesData & { algo: string, pool: string };

interface TableData {
  name: string;
  pool: string;
  algo: string;
  value: number;
  age: string;
}

const PRETTY_DATE_JS_OPTIONS = {
  lang: {
    days: ['d', 'd'],
    hours: ['h', 'h'],
    minutes: ['m', 'm'],
    misc: ['ago', 'error'],
    months: ['M', 'M'],
    seconds: ['s', 's'],
    years: ['y', 'y'],
  },
};

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

@Component({
  selector: 'msu-pool-profitability',
  styleUrls: ['./pool-profitability.component.scss'],
  templateUrl: './pool-profitability.component.html',
})
export class PoolProfitabilityComponent {
  public readonly pools: typeof POOLS = POOLS;
  public readonly algos: typeof ALGORITHMS = ALGORITHMS;

  public readonly data: Observable<TimeseriesDataWithKeys[]>;
  public readonly hourlyData: Observable<TimeseriesDataWithKeys[]>;
  public readonly dailyData: Observable<TimeseriesDataWithKeys[]>;

  public readonly filterForm: FormGroup;

  public readonly tableData: Observable<TableData[]>;
  public readonly columnsToDisplay: string[] = ['name', 'profitability', 'timestamp'];

  public constructor(
    private readonly db: AngularFireDatabase,
  ) {
    this.filterForm = new FormGroup({
      algos: new FormGroup(
        ALGORITHMS.reduce(
          (result, pool) => {
            result[pool] = new FormControl(true);
            return result;
          },
          {} as Dictionary<FormControl>,
        ),
      ),
      pools: new FormGroup(
        POOLS.reduce(
          (result, pool) => {
            result[pool] = new FormControl(true);
            return result;
          },
          {} as Dictionary<FormControl>,
        ),
      ),
      textFilter: new FormControl(''),
    });

    this.data = this.buildFilterChain(
      (p, a) => this.watchProfitability(p, a, 'minute', convertMinuteData, 120),
    );
    this.hourlyData = this.buildFilterChain(
      (p, a) => this.watchProfitability(p, a, 'hour', convertRollupData, 72),
    );
    this.dailyData = this.buildFilterChain(
      (p, a) => this.watchProfitability(p, a, 'day', convertRollupData, 30),
    );

    this.tableData = this.data.map(results => {
      return results
        .map((result): TableData => {
          const mostRecent = result.series.reduce(
            (newest, next) => {
              if (newest.name.getTime() < next.name.getTime()) {
                return next;
              }
              return newest;
            },
            result.series[0],
          );

          return {
            age: moment(mostRecent.name).fromNow(),
            algo: result.algo,
            name: result.name,
            pool: result.pool,
            value: mostRecent.value,
          };
        })
        .sort((a, b) => b.value - a.value);
    });
  }

  private buildFilterChain(
    source: (pool: string, algo: string) => Observable<TimeseriesDataWithKeys>,
  ): Observable<TimeseriesDataWithKeys[]> {
    return Observable.combineLatest(
      ..._.flatten(
        POOLS.map((pool) => ALGORITHMS.map((algo) => source(pool, algo))),
      ),
    )
      .debounceTime(1000)
      .combineLatest(
        this.filterForm.valueChanges
          .startWith(this.filterForm.value),
      )
      // tslint:disable-next-line:no-any
      .map(([results, filter]: [TimeseriesDataWithKeys[], any]) => {
        return results.filter(
          (result) => {
            return result.series.length > 0 &&
              filter.pools[result.pool] &&
              filter.algos[result.algo] &&
              (!filter.textFilter || result.name.indexOf(filter.textFilter) >= 0);
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
