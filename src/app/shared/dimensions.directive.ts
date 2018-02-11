import { Directive, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

@Directive({
  exportAs: 'msuDimensions',
  selector: '[msuDimensions]',
})
export class DimensionsDirective implements OnInit, OnDestroy {
  public value: [number, number] = [0, 0];

  private subscription: Subscription;

  public constructor(
    private readonly elementRef: ElementRef,
  ) {
  }

  public ngOnInit(): void {
    this.subscription = Observable.fromEvent(window, 'resize')
      .startWith(null)
      .subscribe(() => {
        const element = this.elementRef.nativeElement as HTMLElement;
        this.value = [element.offsetWidth, element.offsetHeight];
      });
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
