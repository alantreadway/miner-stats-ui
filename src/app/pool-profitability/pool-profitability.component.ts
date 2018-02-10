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
import { MetricsService, TimeseriesDataWithKeys } from 'app/shared/metrics.service';
import { TimeseriesData } from 'app/shared/timeseries.interface';
import { Dictionary } from 'lodash';

interface TableData {
  name: string;
  pool: string;
  algo: string;
  value: number;
  age: string;
}

@Component({
  selector: 'msu-pool-profitability',
  styleUrls: ['./pool-profitability.component.scss'],
  templateUrl: './pool-profitability.component.html',
})
export class PoolProfitabilityComponent {
  public readonly pools: typeof POOLS = POOLS;
  public readonly algos: typeof ALGORITHMS = ALGORITHMS;

  public readonly minuteData: Observable<TimeseriesDataWithKeys[]>;
  public readonly hourData: Observable<TimeseriesDataWithKeys[]>;
  public readonly dayData: Observable<TimeseriesDataWithKeys[]>;

  public readonly filterForm: FormGroup;

  public readonly tableData: Observable<TableData[]>;
  public readonly columnsToDisplay: (keyof TableData)[] =
    ['name', 'value', 'age'];

  public constructor(
    private readonly metrics: MetricsService,
  ) {
    this.filterForm = new FormGroup({
      name: new FormControl(''),
    });

    const data =
      this.metrics.getProfitabilityStats(
        this.filterForm.valueChanges
          .startWith(this.filterForm.value),
      );
    this.dayData = data.dayData;
    this.hourData = data.hourData;
    this.minuteData = data.minuteData;

    this.tableData = this.minuteData.map(results => {
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
}
