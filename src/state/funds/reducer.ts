import { createReducer } from '@reduxjs/toolkit'
import { SupportedNetwork } from 'constants/networks'

import { updateFundData } from './actions'

export interface FundData {
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
