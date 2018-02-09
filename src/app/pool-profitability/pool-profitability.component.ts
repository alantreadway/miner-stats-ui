import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AngularFireDatabase } from 'angularfire2/database';
import * as _ from 'lodash';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/startWith';
import { Observable } from 'rxjs/Observable';

import { ALGORITHMS, POOLS, RIG_PROFILE } from 'app/shared/configurations';
import {
  MiningPoolAlgorithmProfitabilityRecord,
  MiningPoolAlgorithmProfitabilityRollupRecord,
} from 'app/shared/firebase.interface';
import { TimeseriesData } from 'app/shared/timeseries.interface';
import { Dictionary } from 'lodash';

@Component({
  selector: 'msu-pool-profitability',
  styleUrls: ['./pool-profitability.component.scss'],
  templateUrl: './pool-profitability.component.html',
})
export class PoolProfitabilityComponent {
  public readonly pools: typeof POOLS = POOLS;
  public readonly algos: typeof ALGORITHMS = ALGORITHMS;

  public readonly data: Observable<TimeseriesData[]>;
  public readonly hourlyData: Observable<TimeseriesData[]>;
  public readonly dailyData: Observable<TimeseriesData[]>;

  public filterForm: FormGroup;

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
    });

    // tslint:disable-next-line:no-any
    const filterFn = ([results, filter]: [TimeseriesData[], any]) => {
      return results.filter(
        (result) => {
          const keys = result.name.split(' - ');
          return filter.pools[keys[0]] && filter.algos[keys[1]];
        },
      );
    };

    this.data = Observable.combineLatest(
      ..._.flatten(
        POOLS.map(
          (pool) => ALGORITHMS.map((algo) => this.watchProfitabilityMinutes(pool, algo)),
        ),
      ),
    )
      .debounceTime(1000)
      .combineLatest(
        this.filterForm.valueChanges
          .startWith(this.filterForm.value),
      )
      .map(filterFn);

    this.hourlyData = Observable.combineLatest(
      ..._.flatten(
        POOLS.map(
          (pool) => ALGORITHMS.map((algo) => this.watchProfitabilityRollup(pool, algo, 'hour')),
        ),
      ),
    )
      .debounceTime(1000)
      .combineLatest(
        this.filterForm.valueChanges
          .startWith(this.filterForm.value),
      )
      .map(filterFn);

    this.dailyData = Observable.combineLatest(
      ..._.flatten(
        POOLS.map(
          (pool) => ALGORITHMS.map((algo) => this.watchProfitabilityRollup(pool, algo, 'day')),
        ),
      ),
    )
      .debounceTime(1000)
      .combineLatest(
        this.filterForm.valueChanges
          .startWith(this.filterForm.value),
      )
      .map(filterFn);
  }

  private watchProfitabilityMinutes(
    pool: string,
    algo: string,
    limitMinutes = 120,
  ): Observable<TimeseriesData> {
    const multiplier = this.multiplier(pool, algo);

    return this.db.list<MiningPoolAlgorithmProfitabilityRecord>(
      `/v2/pool/${pool}/${algo}/profitability/per-minute`,
      (query) => query.limitToLast(120),
    )
      .valueChanges()
      .map(
        (data): TimeseriesData => {
          const now = Date.now();

          return {
            name: `${pool} - ${algo}`,
            series: data.map(r => {
              return {
                name: new Date(r.timestamp * 1000),
                value: r.amount.amount * multiplier,
              };
            })
              .filter(set => set.name.getTime() > (now - limitMinutes * 60 * 1000)),
          };
        },
    );
  }

  private watchProfitabilityRollup(
    pool: string,
    algo: string,
    rollup: string,
  ): Observable<TimeseriesData> {
    const multiplier = this.multiplier(pool, algo);

    return this.db.list<MiningPoolAlgorithmProfitabilityRollupRecord>(
      `/v2/pool/${pool}/${algo}/profitability/per-${rollup}`,
      (query) => query.limitToLast(72),
    )
      .valueChanges()
      .map(
        (data): TimeseriesData => {
          return {
            name: `${pool} - ${algo}`,
            series: data.map(r => {
              return {
                max: r.max.amount * multiplier,
                min: r.min.amount * multiplier,
                name: new Date(r.timestamp * 1000),
                value: (r.sum.amount / r.count) * multiplier,
              };
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
