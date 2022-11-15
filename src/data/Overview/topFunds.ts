import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Fund, FundFields } from 'types/fund'

export const FUNDS_BULK = () => {
  const queryString = `
    query funds {
      funds(orderBy: profitUSD, orderDirection: desc, subgraphError: allow) {
        id
        address
        createdAtTimestamp
        manager
        investorCount
        principalUSD
        volumeETH
        volumeUSD
        feeVolumeETH
        feeVolumeUSD
        tokens
        tokensVolumeUSD
        profitUSD
        profitRatio
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
          manager: fundFields.manager,
          investorCount: parseInt(fundFields.investorCount),
          principalUSD: parseFloat(fundFields.principalUSD),
          volumeETH: parseFloat(fundFields.volumeETH),
          volumeUSD: parseFloat(fundFields.volumeUSD),
          feeVolumeETH: parseFloat(fundFields.feeVolumeETH),
          feeVolumeUSD: parseFloat(fundFields.feeVolumeUSD),
          tokens: fundFields.tokens,
          tokensVolumeUSD: fundFields.tokensVolumeUSD.map((value) => {
            return parseFloat(value)
          }),
          profitUSD: parseFloat(fundFields.profitUSD),
          profitRatio: parseFloat(fundFields.profitRatio),
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
