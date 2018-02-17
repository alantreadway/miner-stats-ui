import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { Subscription } from 'rxjs/Subscription';

const VISIBLE = Observable.fromEvent(document, 'visibilitychange')
  .startWith(null)
  .map(() => document.visibilityState !== 'hidden')
  .publishReplay(1)
  .refCount()
  .distinctUntilChanged();

export function pauseWhenInvisible<T>(): (source: Observable<T>) => Observable<T> {
  return (source) => {
    return Observable.create(
      (subscriber: Subscriber<T>) => {
        let subscription: Subscription | undefined;

        const visibleSubscription = VISIBLE
          .subscribe((visible) => {
            if (visible && subscription == null) {
              subscription = source
                .subscribe(
                  (value) => {
                    try {
                      subscriber.next(value);
                    } catch (err) {
                      subscriber.error(err);
                    }
                  },
                  (err) => subscriber.error(err),
                  () => subscriber.complete(),
              );
            } else if (!visible && subscription != null) {
              subscription.unsubscribe();
              subscription = undefined;
            }
          });

        return () => {
          if (subscription != null) {
            subscription.unsubscribe();
          }
          visibleSubscription.unsubscribe();
        };
      });
  };
}
