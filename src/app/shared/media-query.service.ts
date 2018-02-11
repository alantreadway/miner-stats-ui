import { Injectable } from '@angular/core';
import { ObservableMedia } from '@angular/flex-layout';
import { Observable } from 'rxjs/Observable';

export enum Breakpoint {
  XS,
  SM,
  MD,
  LG,
  XL,
}

@Injectable()
export class MediaQueryService {
  private readonly breakpoint: Observable<Breakpoint>;

  public constructor(
    private readonly observableMedia: ObservableMedia,
  ) {
    this.breakpoint = this.observableMedia.asObservable()
      .startWith(null)
      .combineLatest(
        Observable.fromEvent(window, 'resize')
          .debounceTime(100)
          .startWith(null),
    )
      .map(([d, e]) => {
        let mqAlias = d && d.mqAlias || null;

        if (mqAlias == null) {
          // Unknown/first-pass case, need to guess. Breakpoints based upon:
          // https://github.com/angular/flex-layout/wiki/Responsive-API
          mqAlias = 'xl';
          if (window.innerWidth <= 600) {
            mqAlias = 'xs';
          } else if (window.innerWidth <= 960) {
            mqAlias = 'sm';
          } else if (window.innerWidth <= 1280) {
            mqAlias = 'md';
          } else if (window.innerWidth <= 1440) {
            mqAlias = 'lg';
          }
        }

        switch (mqAlias) {
          default:
          case 'xs':
            return Breakpoint.XS;
          case 'sm':
            return Breakpoint.SM;
          case 'md':
            return Breakpoint.MD;
          case 'lg':
            return Breakpoint.LG;
          case 'xl':
            return Breakpoint.XL;
        }
      })
      .publishReplay(1)
      .refCount();
  }

  public getBreakpointObservable(): Observable<Breakpoint> {
    return this.breakpoint;
  }
}
