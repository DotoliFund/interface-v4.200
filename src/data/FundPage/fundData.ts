import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Fund, FundFields } from 'types/fund'

export const FUND_DATA = (fund: string) => {
  const queryString = `
    query fundData {
      Fund(where: {id: ${fund}}, subgraphError: allow) {
        id
        createdAtTimestamp
        createdAtBlockNumber
        manager
        principalETH
        principalUSD
        volumeETH
        volumeUSD
        profitETH
        profitUSD
        profitRatioETH
        profitRatioUSD
        investorCount
      }
    }
    `
  return gql(queryString)
}

interface FundResponse {
  fund: FundFields[]
}

/**
 * Fetch top funds by profit
 */
export function useFundData(fund: string): {
  loading: boolean
  error: boolean
  data: Fund[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<FundResponse>(FUND_DATA(fund), {
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
    ? data.fund.map((value, index) => {
        const fundFields = data.fund[index]
        const fundData: Fund = {
          address: fundFields.id,
          createdAtTimestamp: parseFloat(fundFields.createdAtTimestamp),
          createdAtBlockNumber: parseFloat(fundFields.createdAtBlockNumber),
          manager: fundFields.manager,
          principalETH: parseFloat(fundFields.principalETH),
          principalUSD: parseFloat(fundFields.principalUSD),
          volumeETH: parseFloat(fundFields.volumeETH),
          volumeUSD: parseFloat(fundFields.volumeUSD),
          profitETH: parseFloat(fundFields.profitETH),
          profitUSD: parseFloat(fundFields.profitUSD),
          profitRatioETH: parseFloat(fundFields.profitRatioETH),
          profitRatioUSD: parseFloat(fundFields.profitRatioUSD),
          investorCount: parseInt(fundFields.investorCount),
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
