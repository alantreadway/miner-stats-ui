const ALGORITHMS = {
  axiom: true,
  bastion: true,
  bitcore: true,
  blake: true,
  blake256r14: true,
  blake256r8: true,
  blake256r8vnl: true,
  blake2b: true,
  blake2s: true,
  blakecoin: true,
  bmw: true,
  c11: true,
  cryptonight: true,
  daggerhashimoto: true,
  decred: true,
  deep: true,
  equihash: true,
  ethash: true,
  fresh: true,
  fugue256: true,
  groestl: true,
  hmq1725: true,
  hodl: true,
  hsr: true,
  jackpot: true,
  jha: true,
  keccak: true,
  lbry: true,
  luffa: true,
  lyra2: true,
  lyra2re: true,
  lyra2re2: true,
  lyra2rev2: true,
  lyra2v2: true,
  lyra2z: true,
  m7m: true,
  'myr-gr': true,
  myriad: true,
  neoscrypt: true,
  nist5: true,
  pascal: true,
  penta: true,
  phi: true,
  polytimos: true,
  quark: true,
  qubit: true,
  s3: true,
  scrypt: true,
  scryptjanenf16: true,
  scryptnf: true,
  sha256: true,
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
  whirlpoolx: true,
  x11: true,
  x11evo: true,
  x11ghost: true,
  x13: true,
  x14: true,
  x15: true,
  x17: true,
  xevan: true,
  yescrypt: true,
  zr5: true,
};

const ALGO_FOCUSED_POOLS = {
  ahashpool: true,
  miningpoolhub: true,
  nicehash: true,
};

const COIN_FOCUSED_POOLS = {
  nanopool: true,
};

export type Algorithm = keyof typeof ALGORITHMS;
export const ALL_ALGORITHMS = Object.keys(ALGORITHMS) as Algorithm[];

export type AlgoFocusedPool = keyof typeof ALGO_FOCUSED_POOLS;
export type CoinFocusedPool = keyof typeof COIN_FOCUSED_POOLS;
export type Pool = AlgoFocusedPool | CoinFocusedPool;
export const ALL_POOLS = Object.keys(ALGO_FOCUSED_POOLS)
  .concat(Object.keys(COIN_FOCUSED_POOLS)) as Pool[];

export function isPool(unknown: string): unknown is Pool {
  // tslint:disable-next-line:no-any
  return ALL_POOLS.indexOf(unknown as any) >= 0;
}

export type SecondsSinceEpoch = number;

export type DigitalCurrency = 'BTC' | 'ETC' | 'ETH' | 'ETN' | 'PASC' | 'SIA' | 'XMR' | 'ZEC';

export interface DigitalCurrencyAmount {
  currency: DigitalCurrency;
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

export interface RigProfile {
  name: string;
  hashrates: {[algo in Algorithm]?: number };
}
export type PoolWallets = {
  [pool in Pool]: {
    'BTC': string;
  };
};
export interface UserProfile {
  defaults: {
    'rig-profile': string;
  };
  'pool-wallet': PoolWallets;
  'rig-profile': {
    [profileUuid: string]: RigProfile;
  };
}

export type CoinPoolTree = {
  [pool in CoinFocusedPool]: {
    [coin in DigitalCurrency]: PoolStatistics;
  };
};

export type AlgoPoolTree = {
  [pool in AlgoFocusedPool]: PoolStatistics;
};

export interface AlgoPoolCurrent extends PoolAlgoRecord {
  pool: AlgoFocusedPool;
  algo: Algorithm;
  poolWorkerProportion?: number;
}

export interface CoinPoolCurrent extends PoolAlgoRecord {
  pool: CoinFocusedPool;
  coin: DigitalCurrency;
  algo: Algorithm;
  poolWorkerProportion?: number;
}

export type PoolCurrent = AlgoPoolCurrent | CoinPoolCurrent;

export function isCoinPoolCurrent(current: PoolCurrent): current is CoinPoolCurrent {
  // tslint:disable-next-line:no-any
  return (current as any).coin != null;
}

export interface Schema {
  v2: {
    'rig-profile': {
      [profileUuid: string]: RigProfile;
    };
    pool: {
      algo: AlgoPoolTree;
      coin: CoinPoolTree;
      // Set of all most recently scraped values, also acts as an index for the algo/coin sub-trees
      // to understand the full range of possible permutations of keys.
      latest: {
        [uniqueId: string]: PoolCurrent;
      };
    };
    user: {
      [firebaseUid: string]: UserProfile;
    };
  };
}

export interface ValidPath<R> {
  path: string[];
  returnType?: R;
}

export interface ValidPathForList<R> {
  path: string[];
  returnType?: R;
}

export function validPath<
  A extends keyof Schema,
  R extends Schema[A]
  >(
    key: [A],
): ValidPath<R>;
export function validPath<
  A extends keyof Schema,
  B extends keyof Schema[A],
  R extends Schema[A][B]
  >(
    key: [A, B],
): ValidPath<R>;
export function validPath<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  R extends Schema[A][B][C]
  >(
    key: [A, B, C],
): ValidPath<R>;
export function validPath<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  R extends Schema[A][B][C][D]
  >(
    key: [A, B, C, D],
): ValidPath<R>;
export function validPath<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  E extends keyof Schema[A][B][C][D],
  R extends Schema[A][B][C][D][E]
  >(
    key: [A, B, C, D, E],
): ValidPath<R>;
export function validPath<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  E extends keyof Schema[A][B][C][D],
  F extends keyof Schema[A][B][C][D][E],
  R extends Schema[A][B][C][D][E][F]
  >(
    key: [A, B, C, D, E, F],
): ValidPath<R>;
export function validPath<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  E extends keyof Schema[A][B][C][D],
  F extends keyof Schema[A][B][C][D][E],
  G extends keyof Schema[A][B][C][D][E][F],
  R extends Schema[A][B][C][D][E][F][G]
  >(
    key: [A, B, C, D, E, F, G],
): ValidPath<R>;
export function validPath<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  E extends keyof Schema[A][B][C][D],
  F extends keyof Schema[A][B][C][D][E],
  G extends keyof Schema[A][B][C][D][E][F],
  H extends keyof Schema[A][B][C][D][E][F][G],
  R extends Schema[A][B][C][D][E][F][G][H]
  >(
    key: [A, B, C, D, E, F, G, H],
): ValidPath<R>;
export function validPath<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  E extends keyof Schema[A][B][C][D],
  F extends keyof Schema[A][B][C][D][E],
  G extends keyof Schema[A][B][C][D][E][F],
  H extends keyof Schema[A][B][C][D][E][F][G],
  I extends keyof Schema[A][B][C][D][E][F][G][H],
  R extends Schema[A][B][C][D][E][F][G][H][I]
  >(
    key: [A, B, C, D, E, F, G, H, I],
): ValidPath<R>;
export function validPath<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  E extends keyof Schema[A][B][C][D],
  F extends keyof Schema[A][B][C][D][E],
  G extends keyof Schema[A][B][C][D][E][F],
  H extends keyof Schema[A][B][C][D][E][F][G],
  I extends keyof Schema[A][B][C][D][E][F][G][H],
  J extends keyof Schema[A][B][C][D][E][F][G][H][I],
  R extends Schema[A][B][C][D][E][F][G][H][I][J]
  >(
    key: [A, B, C, D, E, F, G, H, I, J],
): ValidPath<R>;
export function validPath(path: string[]): ValidPath<{}> {
  return { path };
}

export function validPathForList<
  A extends keyof Schema,
  Z extends keyof Schema[A],
  R extends Schema[A][Z]
  >(
    path: [A],
): ValidPathForList<R>;
export function validPathForList<
  A extends keyof Schema,
  B extends keyof Schema[A],
  Z extends keyof Schema[A][B],
  R extends Schema[A][B][Z]
  >(
    path: [A, B],
): ValidPathForList<R>;
export function validPathForList<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  Z extends keyof Schema[A][B][C],
  R extends Schema[A][B][C][Z]
  >(
    path: [A, B, C],
): ValidPathForList<R>;
export function validPathForList<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  Z extends keyof Schema[A][B][C][D],
  R extends Schema[A][B][C][D][Z]
  >(
    path: [A, B, C, D],
): ValidPathForList<R>;
export function validPathForList<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  E extends keyof Schema[A][B][C][D],
  Z extends keyof Schema[A][B][C][D][E],
  R extends Schema[A][B][C][D][E][Z]
  >(
    path: [A, B, C, D, E],
): ValidPathForList<R>;
export function validPathForList<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  E extends keyof Schema[A][B][C][D],
  F extends keyof Schema[A][B][C][D][E],
  Z extends keyof Schema[A][B][C][D][E][F],
  R extends Schema[A][B][C][D][E][F][Z]
  >(
    path: [A, B, C, D, E, F],
): ValidPathForList<R>;
export function validPathForList<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  E extends keyof Schema[A][B][C][D],
  F extends keyof Schema[A][B][C][D][E],
  G extends keyof Schema[A][B][C][D][E][F],
  Z extends keyof Schema[A][B][C][D][E][F][G],
  R extends Schema[A][B][C][D][E][F][G][Z]
  >(
    path: [A, B, C, D, E, F, G],
): ValidPathForList<R>;
export function validPathForList<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  E extends keyof Schema[A][B][C][D],
  F extends keyof Schema[A][B][C][D][E],
  G extends keyof Schema[A][B][C][D][E][F],
  H extends keyof Schema[A][B][C][D][E][F][G],
  Z extends keyof Schema[A][B][C][D][E][F][G][H],
  R extends Schema[A][B][C][D][E][F][G][H][Z]
  >(
    path: [A, B, C, D, E, F, G, H],
): ValidPathForList<R>;
export function validPathForList<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  E extends keyof Schema[A][B][C][D],
  F extends keyof Schema[A][B][C][D][E],
  G extends keyof Schema[A][B][C][D][E][F],
  H extends keyof Schema[A][B][C][D][E][F][G],
  I extends keyof Schema[A][B][C][D][E][F][G][H],
  Z extends keyof Schema[A][B][C][D][E][F][G][H][I],
  R extends Schema[A][B][C][D][E][F][G][H][I][Z]
  >(
    path: [A, B, C, D, E, F, G, H, I],
): ValidPathForList<R>;
export function validPathForList<
  A extends keyof Schema,
  B extends keyof Schema[A],
  C extends keyof Schema[A][B],
  D extends keyof Schema[A][B][C],
  E extends keyof Schema[A][B][C][D],
  F extends keyof Schema[A][B][C][D][E],
  G extends keyof Schema[A][B][C][D][E][F],
  H extends keyof Schema[A][B][C][D][E][F][G],
  I extends keyof Schema[A][B][C][D][E][F][G][H],
  J extends keyof Schema[A][B][C][D][E][F][G][H][I],
  Z extends keyof Schema[A][B][C][D][E][F][G][H][I][J],
  R extends Schema[A][B][C][D][E][F][G][H][I][J][Z]
  >(
    path: [A, B, C, D, E, F, G, H, I, J],
): ValidPathForList<R>;
export function validPathForList(path: string[]): ValidPath<{}> {
  return { path };
}
