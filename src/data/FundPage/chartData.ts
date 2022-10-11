import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

export const FUND_CHART_DATA_BULK = () => {
  const queryString = `
    query fundChartData {
      fundSnapshots(orderBy: timestamp, orderDirection: asc, subgraphError: allow) {
        id
        timestamp
        fund
        principalUSD
        principalETH
        volumeUSD
        volumeETH
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

export interface FundSnapshotData {
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

interface FundSnapshotFields {
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

interface FundSnapshotDataResponse {
  fundSnapshots: FundSnapshotFields[]
}

/**
 * Fetch top funds by profit
 */
export function useTopFunds(): {
  loading: boolean
  error: boolean
  data: FundSnapshotData[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<FundSnapshotDataResponse>(FUND_CHART_DATA_BULK(), {
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

  const formatted: FundSnapshotData[] = data
    ? data.fundSnapshots.map((value, index) => {
        const fundSnapshotFields = data.fundSnapshots[index]
        const fundSnapshotData: FundSnapshotData = {
          id: fundSnapshotFields.id,
          timestamp: parseFloat(fundSnapshotFields.timestamp),
          fund: fundSnapshotFields.fund,
          principalUSD: parseFloat(fundSnapshotFields.principalUSD),
          principalETH: parseFloat(fundSnapshotFields.principalETH),
          volumeUSD: parseFloat(fundSnapshotFields.volumeUSD),
          volumeETH: parseFloat(fundSnapshotFields.volumeETH),
          profitETH: parseFloat(fundSnapshotFields.profitETH),
          profitUSD: parseFloat(fundSnapshotFields.profitUSD),
          profitRatioETH: parseFloat(fundSnapshotFields.profitRatioETH),
          profitRatioUSD: parseFloat(fundSnapshotFields.profitRatioUSD),
          investorCount: parseFloat(fundSnapshotFields.investorCount),
        }
        return fundSnapshotData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
