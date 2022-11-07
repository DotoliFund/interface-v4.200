import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Fund, FundFields } from 'types/fund'

export const FUNDS_BULK = () => {
  const queryString = `
    query funds {
      funds(orderBy: profitETH, orderDirection: desc, subgraphError: allow) {
        id
        address
        createdAtTimestamp
        createdAtBlockNumber
        manager
        investorCount
        principalETH
        principalUSD
        volumeETH
        volumeUSD
        profitETH
        profitUSD
        profitRatioETH
        profitRatioUSD
        feeVolumeETH
        feeVolumeUSD
      }
    }
    `
  return gql(queryString)
}

interface FundDataResponse {
  funds: FundFields[]
}

/**
 * Fetch top funds by profit
 */
export function useTopFunds(): {
  loading: boolean
  error: boolean
  data: Fund[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<FundDataResponse>(FUNDS_BULK(), {
    client: dataClient,
  })

  const anyError = Boolean(error)
  const anyLoading = Boolean(loading)

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: [],
    }
  }

  const formatted: Fund[] = data
    ? data.funds.map((value, index) => {
        const fundFields = data.funds[index]
        const fundData: Fund = {
          address: fundFields.address,
          createdAtTimestamp: parseFloat(fundFields.createdAtTimestamp),
          createdAtBlockNumber: parseFloat(fundFields.createdAtBlockNumber),
          manager: fundFields.manager,
          investorCount: parseInt(fundFields.investorCount),
          principalETH: parseFloat(fundFields.principalETH),
          principalUSD: parseFloat(fundFields.principalUSD),
          volumeETH: parseFloat(fundFields.volumeETH),
          volumeUSD: parseFloat(fundFields.volumeUSD),
          profitETH: parseFloat(fundFields.profitETH),
          profitUSD: parseFloat(fundFields.profitUSD),
          profitRatioETH: parseFloat(fundFields.profitRatioETH),
          profitRatioUSD: parseFloat(fundFields.profitRatioUSD),
          feeVolumeETH: parseFloat(fundFields.feeVolumeETH),
          feeVolumeUSD: parseFloat(fundFields.feeVolumeUSD),
        }
        return fundData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
