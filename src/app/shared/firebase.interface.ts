export interface DigitalCurrencyAmount {
  currency: 'BTC';
  amount: number;
}

export type SecondsSinceEpoch = number;

export interface MiningPoolAlgorithmProfitabilityRecord {
  amount: DigitalCurrencyAmount;
  timestamp: SecondsSinceEpoch;
}

export interface MiningPoolAlgorithmProfitabilityRollupRecord {
  min: DigitalCurrencyAmount;
  max: DigitalCurrencyAmount;
  sum: DigitalCurrencyAmount;
  count: number;
  timestamp: SecondsSinceEpoch;
}
