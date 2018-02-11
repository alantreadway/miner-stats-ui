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

  public graphSize: Observable<[number, number]>;
  public graphSizeFlex: Observable<string>;
  public isXS: Observable<boolean>;

  public constructor(
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
        `${y + 10 + 48 + 109}px` :
        `${x + 20 + 48}px`,
    );
  }
}
