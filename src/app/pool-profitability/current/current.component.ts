import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { PageEvent } from '@angular/material';
import * as _ from 'lodash';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { MetricsService, PoolCurrentKey } from 'app/shared/metrics.service';
import { pauseWhenInvisible } from 'app/shared/rxjs-util';
import {
  Algorithm,
  ALL_ALGORITHMS,
  ALL_POOLS,
  DigitalCurrency,
  isAlgoFocusedPool,
  isAlgoPoolBookmark,
  isAlgoPoolCurrent,
  isCoinFocusedPool,
  isCoinPoolBookmark,
  isCoinPoolCurrent,
  Pool,
  PoolCurrent,
  RigProfile,
  UserProfile,
} from 'app/shared/schema';
import { BookmarksService } from '../../shared/bookmarks.service';

interface TableData {
  key: PoolCurrentKey;
  name: string;
  pool: string;
  algo: Algorithm;
  coin?: DigitalCurrency;
  value?: number;
  age?: string;
  poolWorkerProportion?: number;
  bookmark?: UserProfile['bookmarks']['pools'][0];
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
  @Output() public currentHighlight: EventEmitter<PoolCurrentKey[]> = new EventEmitter();

  public readonly pools: Pool[] = ALL_POOLS;
  public readonly algos: Algorithm[] = ALL_ALGORITHMS;

  public tablePageData: Observable<TableData[]>;
  public tablePageNumber: Subject<number> = new BehaviorSubject(0);
  public tablePageSize: Subject<number> = new BehaviorSubject(10);
  public tablePageTotal: Observable<number>;
  public readonly columnsToDisplay: (keyof TableData)[] =
    ['name', 'value', 'age'];

  private outputSubscription: Subscription;

  public constructor(
    private readonly metrics: MetricsService,
    private readonly bookmarks: BookmarksService,
  ) {
  }

  public ngOnInit(): void {
    const data =
      this.metrics.getProfitabilityStats(
        this.filterSource.debounceTime(500),
        this.rigProfileSource,
      )
        .combineLatest(this.bookmarks.getPoolCoinsOrAlgos())
        .map(([results, bookmarks]) => {
          // Join results with bookmarks.
          return results.map((result) => {
            return {
              ...result,
              bookmark: bookmarks.find((bookmark) => {
                if (bookmark.pool !== result.pool) {
                  return false;
                }

                if (isCoinPoolBookmark(bookmark) && isCoinPoolCurrent(result)) {
                  return bookmark.coin === result.coin;
                }

                if (isAlgoPoolBookmark(bookmark) && isAlgoPoolCurrent(result)) {
                  return bookmark.algo === result.algo;
                }

                return false;
              }),
            };
          });
        })
        .map(
          (results) => _(results)
            .sortBy(
              (r) => (r.bookmark ? 0 : 1),
              (r) => -1 * (r.amount.amount || -1),
            )
            .value(),
        )
        .publishReplay(1)
        .refCount();

    const tableData = data
      .combineLatest(
        Observable.interval(10000)
          .startWith(null),
      )
      .debounceTime(100)
      .map(([results]) => results
        .map((result): TableData => {
          return {
            age: moment(result.timestamp * 1000).fromNow(),
            algo: result.algo,
            bookmark: result.bookmark,
            coin: isCoinPoolCurrent(result) ? result.coin : undefined,
            key: result.key,
            name: `${result.pool} - ${result.algo}`,
            pool: result.pool,
            poolWorkerProportion: result.poolWorkerProportion,
            value: result.amount.amount,
          };
        }),
      )
      .publishReplay(1)
      .refCount();

    this.tablePageTotal = tableData.map(d => d.length);
    this.tablePageData = tableData
      .combineLatest(this.tablePageNumber, this.tablePageSize)
      .map(([d, page, size]) => d.slice(
        page * size,
        (page + 1) * size,
      ))
      .pipe(pauseWhenInvisible())
      .publishReplay(1)
      .refCount();

    this.outputSubscription = data
      .combineLatest(this.tablePageNumber, this.tablePageSize)
      .map(([d, page, size]) => d.slice(
        page * size,
        (page + 1) * size,
      ))
      .pipe(pauseWhenInvisible())
      .subscribe((results) => this.currentData.next(results));
  }

  public tablePageChanged(event: PageEvent): void {
    this.tablePageNumber.next(event.pageIndex);
  }

  public toggleBookmark(data: TableData): void {
    const pool = data.pool;

    if (data.bookmark != null) {
      this.bookmarks.removePoolCoinsOrAlgos(data.bookmark)
        .take(1)
        .subscribe();
    } else if (isCoinFocusedPool(pool) && data.coin != null) {
      this.bookmarks.addPoolCoinsOrAlgos({ pool, coin: data.coin })
        .take(1)
        .subscribe();
    } else if (isAlgoFocusedPool(pool)) {
      this.bookmarks.addPoolCoinsOrAlgos({ pool, algo: data.algo })
        .take(1)
        .subscribe();
    }
  }

  public ngOnDestroy(): void {
    this.outputSubscription.unsubscribe();
  }

  public highlight(data: TableData): void {
    this.currentHighlight.next([data.key]);
  }

  public unhighlight(data: TableData): void {
    this.currentHighlight.next([]);
  }
}
