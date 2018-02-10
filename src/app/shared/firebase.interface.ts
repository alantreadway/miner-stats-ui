export interface DigitalCurrencyAmount {
  currency: 'BTC';
  amount: number;
}

export type SecondsSinceEpoch = number;

export interface PoolAlgoRecord {
  amount: DigitalCurrencyAmount;
  timestamp: SecondsSinceEpoch;
}

export interface PoolAlgoRollupRecord {
  min: DigitalCurrencyAmount;
  max: DigitalCurrencyAmount;
  sum: DigitalCurrencyAmount;
  count: number;
  timestamp: SecondsSinceEpoch;
}
