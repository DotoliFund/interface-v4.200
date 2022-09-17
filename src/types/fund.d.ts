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
  manager: string
  investor: string
  tokens: string[]
}

// fund : '0xd850e79a4e02FC72CADB3bC303682907bC16662a'
// manager : '0xAC8fa658D92eB97D92c145774d103f4D9578da16'
// investor : '0xAC8fa658D92eB97D92c145774d103f4D9578da16'
// tokens : ['0xc778417E063141139Fce010982780140Aa0cD5Ab', '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984']
