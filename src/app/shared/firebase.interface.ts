export interface DigitalCurrencyAmount {
  currency: 'BTC';
  amount: number;
}

export type SecondsSinceEpoch = number;

export interface PoolAlgoProfitabilityRecord {
  amount: DigitalCurrencyAmount;
  timestamp: SecondsSinceEpoch;
}

export interface PoolAlgoProfitabilityRollupRecord {
  min: DigitalCurrencyAmount;
  max: DigitalCurrencyAmount;
  sum: DigitalCurrencyAmount;
  count: number;
  timestamp: SecondsSinceEpoch;
}
