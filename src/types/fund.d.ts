import { BigNumber } from '@ethersproject/bignumber'

export interface FundDetails {
  nonce: BigNumber
  tokenId: BigNumber
  operator: string
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: BigNumber
  feeGrowthInside0LastX128: BigNumber
  feeGrowthInside1LastX128: BigNumber
  tokensOwed0: BigNumber
  tokensOwed1: BigNumber
}

// export interface FundDetails {
//   fundAddress: string
//   manager: string
//   investor: string
//   tokens: string[]
// }