import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { PoolCurrent, RigProfile } from 'app/shared/schema';

@Component({
  selector: 'msu-pool-profitability',
  styleUrls: ['./pool-profitability.component.scss'],
  templateUrl: './pool-profitability.component.html',
})
export class PoolProfitabilityComponent {
  public readonly currentData: Observable<PoolCurrent[]>;
  public readonly rigProfile: Observable<RigProfile>;

  private readonly currentDataSubject: Subject<PoolCurrent[] | undefined> =
    new BehaviorSubject<PoolCurrent[] | undefined>(undefined);
  private readonly rigProfileSubject: Subject<RigProfile | undefined> =
    new BehaviorSubject<RigProfile | undefined>(undefined);

  public constructor() {
    this.currentData = this.currentDataSubject.filter((v): v is PoolCurrent[] => v != null);
    this.rigProfile = this.rigProfileSubject.filter((v): v is RigProfile => v != null);
  }

  public updateCurrentData(outputs: PoolCurrent[]): void {
    this.currentDataSubject.next(outputs);
  }

  public updateRigProfile(rigProfile: RigProfile): void {
    this.rigProfileSubject.next(rigProfile);
  }
}
