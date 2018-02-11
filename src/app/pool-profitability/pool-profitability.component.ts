import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';

import { ObservableMedia } from '@angular/flex-layout';
import { MatSelectChange, PageEvent } from '@angular/material';
import { OFFLINE_RIG_PROFILE } from 'app/shared/configurations';
import { Breakpoint, MediaQueryService } from 'app/shared/media-query.service';
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

const SORTED_FILTER_NAMES = [
  ...ALL_ALGORITHMS,
  ...ALL_POOLS,
  ..._.flatten(ALL_POOLS.map(p => ALL_ALGORITHMS.map(a => `${p} - ${a}`))),
]
  .sort();

@Component({
  selector: 'msu-pool-profitability',
  styleUrls: ['./pool-profitability.component.scss'],
  templateUrl: './pool-profitability.component.html',
})
export class PoolProfitabilityComponent {
  public graphSize: Observable<[number, number]>;
  public graphSizeFlex: Observable<string>;
  public isXS: Observable<boolean>;

  public readonly keys: typeof Object.keys = Object.keys;

  public readonly pools: Pool[] = ALL_POOLS;
  public readonly algos: Algorithm[] = ALL_ALGORITHMS;

  public readonly minuteData: Observable<PoolAlgoData[]>;
  public readonly hourData: Observable<PoolAlgoData[]>;
  public readonly dayData: Observable<PoolAlgoData[]>;

  public readonly filterForm: FormGroup;
  public readonly filterNameOptions: Observable<string[]>;

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
    private readonly mediaQuery: MediaQueryService,
  ) {
    this.graphSize = this.mediaQuery.getBreakpointObservable()
      .map((breakpoint): [number, number] => {
        switch (breakpoint) {
          case Breakpoint.XS:
          case Breakpoint.SM:
          case Breakpoint.MD:
            return [window.innerWidth - 40, window.innerWidth * 0.5];
          case Breakpoint.LG:
            return [window.innerWidth / 2, 600];
          default:
          case Breakpoint.XL:
            return [window.innerWidth / 2, 800];
        }
      })
      .publishReplay(1)
      .refCount();

    this.isXS = this.mediaQuery.getBreakpointObservable()
      .map((breakpoint) => breakpoint <= Breakpoint.XS)
      .publishReplay(1)
      .refCount();

    this.graphSizeFlex = this.mediaQuery.getBreakpointObservable()
      .combineLatest(this.graphSize)
      // Flex grid main dimension switches below LG, so we need to use Y vs. X
      // dimension for flex-box sizing.
      .map(([breakpoint, [x, y]]) => breakpoint < Breakpoint.LG ?
        // Main dimension + margin + padding <+ additional content>.
        `${y + 10 + 48 + 109 }px` :
        `${x + 20 + 48}px`,
      );

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
    this.filterNameOptions = Observable.of(SORTED_FILTER_NAMES)
      .combineLatest(this.filterForm.valueChanges.startWith({}))
      .map(([names, form]) => {
        return form.name ?
          names.filter(n => n.indexOf(form.name) >= 0) :
          names;
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
      ))
      .publishReplay(1)
      .refCount();

    this.dayData = data.dayData
      .combineLatest(this.tablePageData)
      .map(([results, tableData]) => results
        .filter(r => r.series.length > 0)
        .filter(r => tableData.findIndex(td => td.name === r.name) >= 0),
      );
    this.hourData = data.hourData
      .combineLatest(this.tablePageData)
      .map(([results, tableData]) => results
        .filter(r => r.series.length > 0)
        .filter(r => tableData.findIndex(td => td.name === r.name) >= 0),
      );
    this.minuteData = data.minuteData
      .combineLatest(this.tablePageData)
      .map(([results, tableData]) => results
        .filter(r => r.series.length > 0)
        .filter(r => tableData.findIndex(td => td.name === r.name) >= 0),
      );
  }

  public tablePageChanged(event: PageEvent): void {
    this.tablePageNumber.next(event.pageIndex);
  }

  public rigProfileSelected(event: MatSelectChange): void {
    this.selectedProfile.next(event.value);
  }
}
