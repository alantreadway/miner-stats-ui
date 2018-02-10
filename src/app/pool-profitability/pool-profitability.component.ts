import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { AngularFireDatabase } from 'angularfire2/database';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';

import { BREAKPOINTS, ObservableMedia } from '@angular/flex-layout';
import { MatSelectChange, PageEvent } from '@angular/material';
import { OFFLINE_RIG_PROFILE } from 'app/shared/configurations';
import { MetricsService, PoolAlgoData } from 'app/shared/metrics.service';
import {
  Algorithm,
  ALL_ALGORITHMS,
  ALL_POOLS,
  Pool,
  PoolAlgoRecord,
  PoolAlgoRollupRecord,
  RigProfile,
} from 'app/shared/schema';
import { TimeseriesData } from 'app/shared/timeseries.interface';
import { Dictionary } from 'lodash';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { RigProfilesService } from '../shared/rig-profiles.service';

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
  public graphSize: Observable<[number, number]>;
  public graphSizeFlex: Observable<string>;

  public readonly keys: typeof Object.keys = Object.keys;

  public readonly pools: Pool[] = ALL_POOLS;
  public readonly algos: Algorithm[] = ALL_ALGORITHMS;

  public readonly minuteData: Observable<PoolAlgoData[]>;
  public readonly hourData: Observable<PoolAlgoData[]>;
  public readonly dayData: Observable<PoolAlgoData[]>;

  public readonly filterForm: FormGroup;

  public readonly tableData: Observable<TableData[]>;
  public readonly tablePageData: Observable<TableData[]>;
  public tablePageNumber: Subject<number> = new BehaviorSubject(0);
  public tablePageSize: Subject<number> = new BehaviorSubject(10);
  public tablePageTotal: Observable<number>;
  public readonly columnsToDisplay: (keyof TableData)[] =
    ['name', 'value', 'age'];

  public readonly availableRigProfiles: Observable<{ [uuid: string]: RigProfile }>;
  public readonly selectedProfile: Subject<string> = new Subject<string>();

  public constructor(
    private readonly metrics: MetricsService,
    private readonly rigProfiles: RigProfilesService,
    private observableMedia: ObservableMedia,
  ) {
    this.graphSize = this.observableMedia.asObservable()
      .combineLatest(
        Observable.fromEvent(window, 'resize')
          .debounceTime(100)
          .startWith(null),
      )
      .map(([d, e]): [number, number] => {
        switch (d.mqAlias) {
          case 'xs':
            return [window.innerWidth, window.innerWidth * 0.4];
          case 'sm':
            return [window.innerWidth, window.innerWidth * 0.4];
          case 'md':
            return [window.innerWidth, window.innerWidth * 0.4];
          case 'lg':
            return [600, 600];
          default:
          case 'xl':
            return [800, 800];
        }
      });
    this.graphSizeFlex = this.graphSize.map(([x, y]) => `${x}px ${y + 100}px`);

    this.availableRigProfiles = this.rigProfiles.getRigProfiles();

    this.rigProfiles.getDefaultRigProfile()
      .first()
      .subscribe((defaultProfile) => {
        if (defaultProfile != null) {
          this.selectedProfile.next(defaultProfile);
        }
      }),

    this.filterForm = new FormGroup({
      name: new FormControl(''),
    });

    const data =
      this.metrics.getProfitabilityStats(
        this.filterForm.valueChanges
          .startWith(this.filterForm.value)
          .debounceTime(500),
        this.availableRigProfiles
          .combineLatest(this.selectedProfile)
          .map(([profiles, selected]) => profiles[selected]),
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
    })
      .publishReplay(1)
      .refCount();

    this.tablePageTotal = this.tableData.map(d => d.length);
    this.tablePageData = this.tableData
      .combineLatest(this.tablePageNumber, this.tablePageSize)
      .map(([d, page, size]) => d.slice(
        page * size,
        (page + 1) * size,
      ));
  }

  public tablePageChanged(event: PageEvent): void {
    this.tablePageNumber.next(event.pageIndex);
  }

  public rigProfileSelected(event: MatSelectChange): void {
    this.selectedProfile.next(event.value);
  }
}
