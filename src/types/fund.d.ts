// import { BigNumber } from '@ethersproject/bignumber'

// export interface FundDetails {
//   nonce: BigNumber
//   tokenId: BigNumber
//   operator: string
//   token0: string
//   token1: string
//   fee: number
//   tickLower: number
//   tickUpper: number
//   liquidity: BigNumber
//   feeGrowthInside0LastX128: BigNumber
//   feeGrowthInside1LastX128: BigNumber
//   tokensOwed0: BigNumber
//   tokensOwed1: BigNumber
// }

export interface FundDetails {
  fund: string
  investor: string
  //tokens: string[]
}

export type Transaction = {
  type: TransactionType
  hash: string
  timestamp: string
  sender: string
  token0Symbol: string
  token1Symbol: string
  token0Address: string
  token1Address: string
  amountUSD: number
  amountToken0: number
  amountToken1: number
}

export enum TransactionType {
  SWAP,
  MINT,
  BURN,
}
