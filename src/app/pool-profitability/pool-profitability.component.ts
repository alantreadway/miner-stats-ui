import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { Outputs } from 'app/pool-profitability/current/current.component';
import { PoolAlgoData } from 'app/shared/metrics.service';

@Component({
  selector: 'msu-pool-profitability',
  styleUrls: ['./pool-profitability.component.scss'],
  templateUrl: './pool-profitability.component.html',
})
export class PoolProfitabilityComponent {
  public minuteData: Observable<PoolAlgoData[]>;
  public hourData: Observable<PoolAlgoData[]>;
  public dayData: Observable<PoolAlgoData[]>;

  public saveDataReferences(outputs: Outputs): void {
    // Temporarily route all data through CurrentComponent and back into HistoryComponent. This
    // should ultimately just be a flow of filter criteria (pool/algo tuples) and other variables
    // rather than all of the data.
    this.minuteData = outputs.minuteData;
    this.hourData = outputs.hourData;
    this.dayData = outputs.dayData;
  }
}
