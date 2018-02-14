import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSelectChange, PageEvent } from '@angular/material';
import * as _ from 'lodash';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { MetricsService, PoolAlgoData } from 'app/shared/metrics.service';
import { RigProfilesService } from 'app/shared/rig-profiles.service';
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

const SORTED_FILTER_NAMES = [
  ...ALL_ALGORITHMS,
  ...ALL_POOLS,
  ..._.flatten(ALL_POOLS.map(p => ALL_ALGORITHMS.map(a => `${p} - ${a}`))),
]
  .sort();

@Component({
  selector: 'msu-current',
  styleUrls: ['./current.component.scss'],
  templateUrl: './current.component.html',
})
export class CurrentComponent implements OnDestroy {
  @Output() public currentData: EventEmitter<PoolCurrent[]> = new EventEmitter();
  @Output() public currentRigProfile: EventEmitter<RigProfile> = new EventEmitter();

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

  private outputSubscription: Subscription;

  public constructor(
    private readonly metrics: MetricsService,
    private readonly rigProfiles: RigProfilesService,
  ) {
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
          .map(([profiles, selected]) => profiles[selected])
          .do((profile) => this.currentRigProfile.next(profile)),
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

  public rigProfileSelected(event: MatSelectChange): void {
    this.selectedProfile.next(event.value);
  }

  public ngOnDestroy(): void {
    this.outputSubscription.unsubscribe();
  }
}
