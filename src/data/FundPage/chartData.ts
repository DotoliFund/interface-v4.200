import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { FundSnapshot, FundSnapshotFields } from 'types/fund'

export const FUND_CHART = (fund: string) => {
  const queryString = `
    query fundChartData {
      fundSnapshots(first: 100, orderBy: timestamp, orderDirection: asc, where: {fund: ${fund}}, subgraphError: allow) {
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

interface FundSnapshotResponse {
  fundSnapshots: FundSnapshotFields[]
}

/**
 * Fetch fund chart data
 */
export function useFundChartData(fund: string): {
  loading: boolean
  error: boolean
  data: FundSnapshot[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<FundSnapshotResponse>(FUND_CHART(fund), {
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

  const formatted: FundSnapshot[] = data
    ? data.fundSnapshots.map((value, index) => {
        const fundSnapshotFields = data.fundSnapshots[index]
        const fundSnapshotData: FundSnapshot = {
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
