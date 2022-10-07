import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { FundData } from 'state/funds/reducer'

export const FUNDS_BULK = () => {
  const queryString = `
    query funds {
      funds(orderBy: profitETH, orderDirection: desc, subgraphError: allow) {
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

interface FundFields {
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

/**
 * Fetch top funds by profit
 */
export function useFundDatas(): {
  loading: boolean
  error: boolean
  data: FundData[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<FundFields[]>(FUNDS_BULK(), {
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

  const formatted: FundData[] = data
    ? data.map((value, index) => {
        const fundFields = data[index]
        const fundData: FundData = {
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
