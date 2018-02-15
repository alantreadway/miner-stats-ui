import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { PageEvent } from '@angular/material';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { MetricsService, PoolAlgoData } from 'app/shared/metrics.service';
import {
  Algorithm,
  ALL_ALGORITHMS,
  ALL_POOLS,
  Pool,
  PoolCurrent,
  RigProfile,
} from 'app/shared/schema';

interface TableData {
  name: string;
  pool: string;
  algo: string;
  value?: number;
  age?: string;
}

@Component({
  selector: 'msu-current',
  styleUrls: ['./current.component.scss'],
  templateUrl: './current.component.html',
})
export class CurrentComponent implements OnInit, OnDestroy {
  @Input() public rigProfileSource: Observable<RigProfile>;
  @Input() public filterSource: Observable<string | null>;

  @Output() public currentData: EventEmitter<PoolCurrent[]> = new EventEmitter();

  public readonly pools: Pool[] = ALL_POOLS;
  public readonly algos: Algorithm[] = ALL_ALGORITHMS;

  public readonly minuteData: Observable<PoolAlgoData[]>;
  public readonly hourData: Observable<PoolAlgoData[]>;
  public readonly dayData: Observable<PoolAlgoData[]>;

  public tableData: Observable<TableData[]>;
  public tablePageData: Observable<TableData[]>;
  public tablePageNumber: Subject<number> = new BehaviorSubject(0);
  public tablePageSize: Subject<number> = new BehaviorSubject(10);
  public tablePageTotal: Observable<number>;
  public readonly columnsToDisplay: (keyof TableData)[] =
    ['name', 'value', 'age'];

  private outputSubscription: Subscription;

  public constructor(
    private readonly metrics: MetricsService,
  ) {
  }

  public ngOnInit(): void {
    const data =
      this.metrics.getProfitabilityStats(
        this.filterSource.debounceTime(500),
        this.rigProfileSource,
      )
        .map(results => results.sort((a, b) => (b.amount.amount || -1) - (a.amount.amount || -1)))
        .publishReplay(1)
        .refCount();

    this.tableData = data
      .combineLatest(Observable.interval(10000).startWith(null))
      .map(([results]) => results
        .map((result): TableData => {
          return {
            age: moment(result.timestamp * 1000).fromNow(),
            algo: result.algo,
            name: `${result.pool} - ${result.algo}`,
            pool: result.pool,
            value: result.amount.amount,
          };
        }),
      )
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

    this.outputSubscription = data
      .combineLatest(this.tablePageNumber, this.tablePageSize)
      .map(([d, page, size]) => d.slice(
        page * size,
        (page + 1) * size,
      ))
      .subscribe((results) => this.currentData.next(results));
  }

  public tablePageChanged(event: PageEvent): void {
    this.tablePageNumber.next(event.pageIndex);
  }

  public ngOnDestroy(): void {
    this.outputSubscription.unsubscribe();
  }
}
