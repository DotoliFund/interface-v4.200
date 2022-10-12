import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { FundSnapshot, FundSnapshotFields } from 'types/fund'

export const XXX_CHART_DATA_BULK = () => {
  const queryString = `
    query fundSnapshots {
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

interface FundSnapshotResponse {
  fundSnapshots: FundSnapshotFields[]
}

/**
 * Fetch xxx chart data
 */
export function useXXXChartData(): {
  loading: boolean
  error: boolean
  data: FundSnapshot[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<FundSnapshotResponse>(XXX_CHART_DATA_BULK(), {
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
