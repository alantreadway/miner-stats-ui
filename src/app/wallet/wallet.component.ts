import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { DigitalCurrencyAmount, Pool } from 'app/shared/schema';
import { WalletsService } from 'app/shared/wallets.service';

@Component({
  selector: 'msu-wallet',
  styleUrls: ['./wallet.component.scss'],
  templateUrl: './wallet.component.html',
})
export class WalletComponent {
  public readonly balances: Observable<{[key in Pool]: DigitalCurrencyAmount}>;

  public readonly keys: typeof Object.keys = Object.keys;

  public constructor(
    walletService: WalletsService,
  ) {
    this.balances = walletService.getAvailableWallets()
      .filter((w): w is Pool[] => w != null)
      .switchMap(
        (wallets) => Observable.combineLatest(
          wallets.map(wallet => walletService.getWalletBalance(wallet)),
        )
          .map(balances => balances.reduce(
            (result, balance, index) => {
              result[wallets[index]] = balance;
              return result;
            },
            {} as {[key in Pool]: DigitalCurrencyAmount},
          )),
      );
    }
}
