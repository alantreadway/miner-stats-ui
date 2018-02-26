import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';

import { Breakpoint, MediaQueryService } from 'app/shared/media-query.service';
import {
  MetricsService,
  PoolAlgoData,
  PoolCurrentKey,
  PoolCurrentWithKey,
} from 'app/shared/metrics.service';
import { pauseWhenInvisible } from 'app/shared/rxjs-util';
import { PoolProfitability, RigProfile } from 'app/shared/schema';

interface TimeseriesDataset {
  title: string;
  shortTitle: string;
  data: Observable<PoolAlgoData[]>;
  highlight: Observable<PoolAlgoData[]>;
}

@Component({
  selector: 'msu-history',
  styleUrls: ['./history.component.scss'],
  templateUrl: './history.component.html',
})
export class HistoryComponent implements OnInit {
  @Input() public currentData: Observable<PoolCurrentWithKey[]>;
  @Input() public currentHighlight: Observable<PoolCurrentKey[]>;
  @Input() public rigProfileSource: Observable<RigProfile>;

  public readonly data: TimeseriesDataset[] = [];

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
    this.data.push(
      { title: 'Last 120 minutes', shortTitle: '120m', ...this.buildDataStream('per-minute') },
    );
    this.data.push(
      { title: 'Last 48 hours', shortTitle: '48h', ...this.buildDataStream('per-hour') },
    );
    this.data.push(
      { title: 'Last 30 days', shortTitle: '30d', ...this.buildDataStream('per-day') },
    );
  }

  public tabChanged(tab: number): void {
    this.selectedTab = tab;
  }

  private buildDataStream(
    granularity: keyof PoolProfitability,
  ): { data: Observable<PoolAlgoData[]>, highlight: Observable<PoolAlgoData[]> } {
    const data = this.currentData
      .distinctUntilChanged(_.isEqual)
      .switchMap((datasets) => Observable.combineLatest(
        datasets.map(d => this.metrics.getTimeSeriesProfitabilityStats(
          d,
          this.rigProfileSource,
          granularity,
        )),
      ))
      .map((datasets) => datasets.map((dataset) => {
        const cutoff = granularity === 'per-minute' ? 120 * 60 :
          granularity === 'per-hour' ? 48 * 60 * 60 :
          granularity === 'per-day' ? 30 * 24 * 60 * 60 :
          0;
        return {
          ...dataset,
          series: dataset.series.filter((v) => v.name.getTime() >= (Date.now() - cutoff * 1000)),
        };
      }))
      .debounceTime(50);

    return {
      data: data.pipe(pauseWhenInvisible()),
      highlight: data
        .combineLatest(
          this.currentHighlight
            .startWith([])
            .debounceTime(50),
        )
        .map(([results, highlights]) => results.filter(r => highlights.indexOf(r.key) >= 0))
        .pipe(pauseWhenInvisible()),
    };
  }
}
