import { Pipe, PipeTransform } from '@angular/core';

import { DigitalCurrency, DigitalCurrencyAmount } from 'app/shared/schema';

const ALT_SYMBOLS: {[currency in DigitalCurrency]?: string} = {
  'BTC': 'm\u0243',
};
const MUTLIPLIER: {[currency in DigitalCurrency]?: number} = {
  'BTC': 1000,
};
const DECIMAL_POINTS: {[currency in DigitalCurrency]?: number} = {
  'BTC': 3,
};

@Pipe({
  name: 'digitalCurrency',
})
export class DigitalCurrencyPipe implements PipeTransform {
  public transform(value?: DigitalCurrencyAmount): string {
    if (value == null) {
      return '-';
    }

    const symbol = ALT_SYMBOLS[value.currency] || value.currency;
    const multiplier = MUTLIPLIER[value.currency] || 1;
    const decimalPoints = DECIMAL_POINTS[value.currency] || 0;

    const formattedNumber = String(value.amount * multiplier)
      .replace(
        /[,.]([0-9])+/,
        (match) => {
          let result = match.substring(0, Math.min(match.length, decimalPoints + 1));
          while (result.length < decimalPoints) {
            result = result + '0';
          }
          return result;
        },
      );

    return `${formattedNumber} ${symbol}`;
  }

}
