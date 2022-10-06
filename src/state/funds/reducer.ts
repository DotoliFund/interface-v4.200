import { createReducer } from '@reduxjs/toolkit'
import { SupportedNetwork } from 'constants/networks'

import { updateFundData } from './actions'

export interface FundData {
  // basic token info
  address: string
  feeTier: number

  token0: {
    name: string
    symbol: string
    address: string
    decimals: number
    derivedETH: number
  }

  token1: {
    name: string
    symbol: string
    address: string
    decimals: number
    derivedETH: number
  }

  // for tick math
  liquidity: number
  sqrtPrice: number
  tick: number

  // volume
  volumeUSD: number
  volumeUSDChange: number
  volumeUSDWeek: number

  // liquidity
  tvlUSD: number
  tvlUSDChange: number

  // prices
  token0Price: number
  token1Price: number

  // token amounts
  tvlToken0: number
  tvlToken1: number
}

export interface FundsState {
  // analytics data from
  byAddress: {
    [networkId: string]: {
      [address: string]: {
        data: FundData | undefined
        lastUpdated: number | undefined
      }
    }
  }
}

export const initialState: FundsState = {
  byAddress: {
    [SupportedNetwork.ETHEREUM]: {},
    [SupportedNetwork.ARBITRUM]: {},
    [SupportedNetwork.OPTIMISM]: {},
    [SupportedNetwork.POLYGON]: {},
    [SupportedNetwork.CELO]: {},
  },
}

export default createReducer(initialState, (builder) =>
  builder.addCase(updateFundData, (state, { payload: { funds, networkId } }) => {
    funds.map(
      (fundData) =>
        (state.byAddress[networkId][fundData.address] = {
          ...state.byAddress[networkId][fundData.address],
          data: fundData,
          lastUpdated: new Date().getTime(),
        })
    )
  })
)
