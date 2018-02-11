import { Component, Input } from '@angular/core';
import { Breakpoint, MediaQueryService } from 'app/shared/media-query.service';
import { PoolAlgoData } from 'app/shared/metrics.service';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'msu-history',
  styleUrls: ['./history.component.scss'],
  templateUrl: './history.component.html',
})
export class HistoryComponent {
  @Input() public minuteData: Observable<PoolAlgoData[]>;
  @Input() public hourData: Observable<PoolAlgoData[]>;
  @Input() public dayData: Observable<PoolAlgoData[]>;

  public isXS: Observable<boolean>;

  public constructor(
    private readonly mediaQuery: MediaQueryService,
  ) {
    this.isXS = this.mediaQuery.getBreakpointObservable()
      .map((breakpoint) => breakpoint <= Breakpoint.XS)
      .publishReplay(1)
      .refCount();
  }
}
