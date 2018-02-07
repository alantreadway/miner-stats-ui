import { Component } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase } from 'angularfire2/database';
import * as firebase from 'firebase';
import * as _ from 'lodash';
import 'rxjs/add/observable/combineLatest';
import { Observable } from 'rxjs/Observable';
import { TimeseriesData } from './graph/graph.component';

const pools = ['nicehash', 'ahashpool'];
const algos = ['blake2s', 'equihash', 'nist5', 'keccak', 'x17'];

export interface DigitalCurrencyAmount {
  currency: 'BTC';
  amount: number;
}

export type SecondsSinceEpoch = number;

interface MiningPoolAlgorithmProfitabilityRecord {
  amount: DigitalCurrencyAmount;
  timestamp: SecondsSinceEpoch;
}

interface MiningPoolAlgorithmProfitabilityRollupRecord {
  min: DigitalCurrencyAmount;
  max: DigitalCurrencyAmount;
  sum: DigitalCurrencyAmount;
  count: number;
  timestamp: SecondsSinceEpoch;
}

const RIG_PROFILE = {
  blake256r14: 1056000000,
  blake2s: 26000000000,
  cryptonight: 3780,
  equihash: 2850,
  keccak: 4400000000,
  lbry: 244000000,
  neoscrypt: 5200000,
  nist5: 251000000,
  pascal: 6300000000,
  skein: 2100000000,
  skunk: 181000000,
  tribus: 330000000,
  x17: 55000000,
};

@Component({
  selector: 'msu-root',
  styleUrls: ['./app.component.css'],
  templateUrl: './app.component.html',
})
export class AppComponent {
  public data: Observable<TimeseriesData[]>;
  public hourlyData: Observable<TimeseriesData[]>;
  public dailyData: Observable<TimeseriesData[]>;

  public constructor(
    public afAuth: AngularFireAuth,
    private readonly db: AngularFireDatabase,
  ) {
    this.data = Observable.combineLatest(
      ..._.flattenDeep(
        pools.map((pool) => algos.map((algo) => this.watchProfitabilityMinutes(pool, algo))),
      ),
    );
    this.hourlyData = Observable.combineLatest(
      ..._.flattenDeep(
        pools.map((pool) => algos.map((algo) => this.watchProfitabilityRollup(pool, algo, 'hour'))),
      ),
    );
    this.dailyData = Observable.combineLatest(
      ..._.flattenDeep(
        pools.map((pool) => algos.map((algo) => this.watchProfitabilityRollup(pool, algo, 'day'))),
      ),
    );
  }

  public login(): void {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  public logout(): void {
    this.afAuth.auth.signOut();
  }

  private watchProfitabilityMinutes(pool: string, algo: string): Observable<TimeseriesData> {
    const multiplier = this.multiplier(pool, algo);

    return this.db.list<MiningPoolAlgorithmProfitabilityRecord>(
      `/v1/pool/${pool}/${algo}/profitability/per-minute`,
      (query) => query.limitToLast(120),
    )
      .valueChanges()
      .map(
        (data): TimeseriesData => {
          return {
            name: `${pool} - ${algo}`,
            series: data.map(r => {
              return {
                name: new Date(r.timestamp * 1000),
                value: r.amount.amount * multiplier,
              };
            }),
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
      `/v1/pool/${pool}/${algo}/profitability/per-${rollup}`,
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
    const spdMultiplier = RIG_PROFILE[algo] / spdDivisor;
    const priceMultiplier = pool === 'nicehash' ? 1 : 1000;
    return spdMultiplier * priceMultiplier;
  }
}
