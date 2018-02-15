import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { ContextService } from 'app/shared/context.service';
import { PoolCurrent, RigProfile } from 'app/shared/schema';

@Component({
  selector: 'msu-pool-profitability',
  styleUrls: ['./pool-profitability.component.scss'],
  templateUrl: './pool-profitability.component.html',
})
export class PoolProfitabilityComponent {
  public readonly rigProfileSource: Observable<RigProfile>;
  public readonly filterSource: Observable<string | null>;

  public readonly currentData: Observable<PoolCurrent[]>;

  private readonly currentDataSubject: Subject<PoolCurrent[] | undefined> =
    new BehaviorSubject<PoolCurrent[] | undefined>(undefined);
  private readonly rigProfileSubject: Subject<RigProfile | undefined> =
    new BehaviorSubject<RigProfile | undefined>(undefined);

  public constructor(
    private readonly context: ContextService,
  ) {
    this.currentData = this.currentDataSubject.filter((v): v is PoolCurrent[] => v != null);
    this.rigProfileSource = this.context.getRigProfile();
    this.filterSource = this.context.getFilter();
  }

  public updateCurrentData(outputs: PoolCurrent[]): void {
    this.currentDataSubject.next(outputs);
  }

  public updateRigProfile(rigProfile: RigProfile): void {
    this.rigProfileSubject.next(rigProfile);
  }
}
