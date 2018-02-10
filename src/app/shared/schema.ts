const ALGORITHMS = {
  bastion: true,
  bitcore: true,
  blake: true,
  blake2s: true,
  blakecoin: true,
  bmw: true,
  decred: true,
  deep: true,
  equihash: true,
  fresh: true,
  fugue256: true,
  groestl: true,
  hmq1725: true,
  hsr: true,
  jackpot: true,
  jha: true,
  keccak: true,
  lbry: true,
  luffa: true,
  lyra2: true,
  lyra2v2: true,
  lyra2z: true,
  'myr-gr': true,
  neoscrypt: true,
  nist5: true,
  penta: true,
  phi: true,
  polytimos: true,
  qubit: true,
  s3: true,
  sha256d: true,
  sha256t: true,
  sia: true,
  sib: true,
  skein: true,
  skein2: true,
  skunk: true,
  timetravel: true,
  tribus: true,
  vanilla: true,
  veltor: true,
  whirlpool: true,
  x11: true,
  x11evo: true,
  x13: true,
  x14: true,
  x15: true,
  x17: true,
  yescrypt: true,
  zr5: true,
};

const POOLS = {
  ahashpool: true,
  miningpoolhub: true,
  nicehash: true,
};

export type Algorithm = keyof typeof ALGORITHMS;
export const ALL_ALGORITHMS = Object.keys(ALGORITHMS) as Algorithm[];

export type Pool = keyof typeof POOLS;
export const ALL_POOLS = Object.keys(POOLS) as Pool[];

export type SecondsSinceEpoch = number;

export interface DigitalCurrencyAmount {
  currency: 'BTC';
  amount: number;
}

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

export interface PoolProfitability {
  'per-minute': {
    [timestamp: number]: PoolAlgoRecord;
  };
  'per-hour': {
    [timestamp: number]: PoolAlgoRollupRecord;
  };
  'per-day': {
    [timestamp: number]: PoolAlgoRollupRecord;
  };
}
export type PoolStatistics = {
  [algo in Algorithm]: { profitability: PoolProfitability };
};

export type RigProfile = { [algo in Algorithm]?: number };
export interface UserProfile {
  defaults: {
    'rig-profile': string;
  };
  'rig-profile': {
    [profileId: string]: RigProfile;
  };
}

export interface Schema {
  v2: {
    pool: {
      [key in Pool]: PoolStatistics;
    };
    user: {
      [firebaseUid: string]: UserProfile;
    };
  };
}
