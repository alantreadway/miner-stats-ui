import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';

import { Breakpoint, MediaQueryService } from 'app/shared/media-query.service';
import { MetricsService, PoolAlgoData } from 'app/shared/metrics.service';
import { pauseWhenInvisible } from 'app/shared/rxjs-util';
import { PoolCurrent, RigProfile } from 'app/shared/schema';

@Component({
  selector: 'msu-history',
  styleUrls: ['./history.component.scss'],
  templateUrl: './history.component.html',
})
export class HistoryComponent implements OnInit {
  @Input() public currentData: Observable<PoolCurrent[]>;
  @Input() public rigProfileSource: Observable<RigProfile>;

  public minuteData: Observable<PoolAlgoData[]>;
  public hourData: Observable<PoolAlgoData[]>;
  public dayData: Observable<PoolAlgoData[]>;

  public selectedTab: number = 0;

  public isXS: Observable<boolean>;

  public constructor(
    private readonly mediaQuery: MediaQueryService,
    private readonly metrics: MetricsService,
  ) {
    this.isXS = this.mediaQuery.getBreakpointObservable()
      .map((breakpoint) => breakpoint <= Breakpoint.XS)
      .publishReplay(1)
      .refCount();
  }

  public ngOnInit(): void {
    this.minuteData = this.currentData
      .distinctUntilChanged(_.isEqual)
      .switchMap((datasets) => Observable.combineLatest(
        datasets.map(d => this.metrics.getTimeSeriesProfitabilityStats(
          d,
          this.rigProfileSource,
          'per-minute',
        )),
      ))
      .debounceTime(100)
      .pipe(pauseWhenInvisible());
    this.hourData = this.currentData
      .distinctUntilChanged(_.isEqual)
      .switchMap((datasets) => Observable.combineLatest(
        datasets.map(d => this.metrics.getTimeSeriesProfitabilityStats(
          d,
          this.rigProfileSource,
          'per-hour',
        )),
      ))
      .debounceTime(100)
      .pipe(pauseWhenInvisible());
    this.dayData = this.currentData
      .distinctUntilChanged(_.isEqual)
      .switchMap((datasets) => Observable.combineLatest(
        datasets.map(d => this.metrics.getTimeSeriesProfitabilityStats(
          d,
          this.rigProfileSource,
          'per-day',
        )),
      ))
      .debounceTime(100)
      .pipe(pauseWhenInvisible());
  }

  public tabChanged(tab: number): void {
    this.selectedTab = tab;
  }
}
