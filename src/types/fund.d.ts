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

export interface Fund {
  address: string
  createdAtTimestamp: number
  createdAtBlockNumber: number
  manager: string
  principalETH: number
  principalUSD: number
  volumeETH: number
  volumeUSD: number
  profitETH: number
  profitUSD: number
  profitRatioETH: number
  profitRatioUSD: number
  investorCount: number
}

export interface FundFields {
  id: string
  createdAtTimestamp: string
  createdAtBlockNumber: string
  manager: string
  principalETH: string
  principalUSD: string
  volumeETH: string
  volumeUSD: string
  profitETH: string
  profitUSD: string
  profitRatioETH: string
  profitRatioUSD: string
  investorCount: string
}

export interface Investor {
  id: string
  createdAtTimestamp: number
  createdAtBlockNumber: number
  fund: string
  manager: string
  investor: string
  principalETH: number
  principalUSD: number
  volumeETH: number
  volumeUSD: number
  profitETH: number
  profitUSD: number
  profitRatioETH: number
  profitRatioUSD: number
}

export interface InvestorFields {
  id: string
  createdAtTimestamp: string
  createdAtBlockNumber: string
  fund: string
  manager: string
  investor: string
  principalETH: string
  principalUSD: string
  volumeETH: string
  volumeUSD: string
  profitETH: string
  profitUSD: string
  profitRatioETH: string
  profitRatioUSD: string
}

export interface FundSnapshot {
  id: string
  timestamp: number
  fund: string
  principalUSD: number
  principalETH: number
  volumeUSD: number
  volumeETH: number
  profitETH: number
  profitUSD: number
  profitRatioETH: number
  profitRatioUSD: number
  investorCount: number
}

export interface FundSnapshotFields {
  id: string
  timestamp: string
  fund: string
  principalUSD: string
  principalETH: string
  volumeUSD: string
  volumeETH: string
  profitETH: string
  profitUSD: string
  profitRatioETH: string
  profitRatioUSD: string
  investorCount: string
}

export interface InvestorSnapshot {
  id: string
  timestamp: number
  fund: string
  manager: string
  investor: string
  principalUSD: number
  principalETH: number
  volumeUSD: number
  volumeETH: number
  profitETH: number
  profitUSD: number
  profitRatioETH: number
  profitRatioUSD: number
}

export interface InvestorSnapshotFields {
  id: string
  timestamp: string
  fund: string
  manager: string
  investor: string
  principalUSD: string
  principalETH: string
  volumeUSD: string
  volumeETH: string
  profitETH: string
  profitUSD: string
  profitRatioETH: string
  profitRatioUSD: string
}
