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
  PoolAlgoRecord,
  PoolAlgoRollupRecord,
} from 'app/shared/firebase.interface';
import { MetricsService, PoolAlgoData } from 'app/shared/metrics.service';
import { TimeseriesData } from 'app/shared/timeseries.interface';
import { Dictionary } from 'lodash';

interface TableData {
  name: string;
  pool: string;
  algo: string;
  value?: number;
  age?: string;
}

@Component({
  selector: 'msu-pool-profitability',
  styleUrls: ['./pool-profitability.component.scss'],
  templateUrl: './pool-profitability.component.html',
})
export class PoolProfitabilityComponent {
  public readonly pools: typeof POOLS = POOLS;
  public readonly algos: typeof ALGORITHMS = ALGORITHMS;

  public readonly minuteData: Observable<PoolAlgoData[]>;
  public readonly hourData: Observable<PoolAlgoData[]>;
  public readonly dayData: Observable<PoolAlgoData[]>;

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
    this.dayData = data.dayData
      .map((results) => results.filter(r => r.series.length > 0));
    this.hourData = data.hourData
      .map((results) => results.filter(r => r.series.length > 0));
    this.minuteData = data.minuteData
      .map((results) => results.filter(r => r.series.length > 0));

    this.tableData = data.minuteData.map(results => {
      return results
        .map((result): TableData => {
          return {
            age: result.mostRecent ? moment(result.mostRecent.name).fromNow() : undefined,
            algo: result.algo,
            name: result.name,
            pool: result.pool,
            value: result.mostRecent ? result.mostRecent.value : undefined,
          };
        })
        .sort((a, b) => (b.value || -1) - (a.value || -1));
    });
  }
}
