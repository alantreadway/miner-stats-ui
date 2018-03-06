import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { Observable } from 'rxjs/Observable';

import { AngularFire2DatabaseAdaptor } from 'app/shared/angular-fire2';
import { DigitalCurrencyAmount, PoolWallets, validPath } from 'app/shared/schema';
import { environment } from 'environments/environment';
import { User } from 'firebase';

const DEFAULT_NO_WALLET_AMOUNT: DigitalCurrencyAmount = {
  amount: 0,
  currency: 'BTC',
};

@Injectable()
export class WalletsService {
  private readonly wallets: Observable<PoolWallets | null>;

  public constructor(
    private readonly auth: AngularFireAuth,
    private readonly http: HttpClient,
    db: AngularFire2DatabaseAdaptor,
  ) {
    const userId = this.auth.authState
      .filter((user): user is User => user != null)
      .map(user => user.uid)
      .publishReplay(1)
      .refCount();

    this.wallets = userId
      .switchMap((uid) => db.object(validPath(['v2', 'user', uid, 'pool-wallet'])))
      .publishReplay(1)
      .refCount();
  }

  public getAvailableWallets(): Observable<(keyof PoolWallets)[] | null> {
    return this.wallets.map((w) => w && Object.keys(w) as (keyof PoolWallets)[]);
  }

  public getWalletBalance(wallet: keyof PoolWallets): Observable<DigitalCurrencyAmount> {
    if (wallet === 'ahashpool') {
      return this.wallets
        .combineLatest(this.auth.idToken)
        .switchMap(
          ([wallets, authToken]) => {
            if (wallets == null) {
              return Observable.of(DEFAULT_NO_WALLET_AMOUNT);
            }

            return this.http.get<DigitalCurrencyAmount>(
              `${environment.apiEndpoint}balance/${wallet}/BTC`,
              {
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                },
              },
            )
              .catch(error => Observable.of(DEFAULT_NO_WALLET_AMOUNT));
          },
        );
    }

    return Observable.of<DigitalCurrencyAmount>(DEFAULT_NO_WALLET_AMOUNT);
  }
}
