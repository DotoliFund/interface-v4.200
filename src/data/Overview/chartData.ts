import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { XXXFund2Snapshot, XXXFund2SnapshotFields } from 'types/fund'

export const XXXFUND2_CHART_DATA_BULK = () => {
  const queryString = `
    query xxxfund2Snapshots {
      xxxfund2Snapshots(orderBy: timestamp, orderDirection: asc, subgraphError: allow) {
        id
        timestamp
        fundCount
        investorCount
        totalVolumeETH
        totalVolumeUSD
      }
    }
    `
  return gql(queryString)
}

interface XXXFund2SnapshotResponse {
  xxxfund2Snapshots: XXXFund2SnapshotFields[]
}

/**
 * Fetch xxx chart data
 */
export function useXXXFund2ChartData(): {
  loading: boolean
  error: boolean
  data: XXXFund2Snapshot[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<XXXFund2SnapshotResponse>(XXXFUND2_CHART_DATA_BULK(), {
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

  const formatted: XXXFund2Snapshot[] = data
    ? data.xxxfund2Snapshots.map((value, index) => {
        const xxxfund2SnapshotFields = data.xxxfund2Snapshots[index]
        const fundSnapshotData: XXXFund2Snapshot = {
          id: xxxfund2SnapshotFields.id,
          timestamp: parseFloat(xxxfund2SnapshotFields.timestamp),
          fundCount: parseFloat(xxxfund2SnapshotFields.fundCount),
          investorCount: parseFloat(xxxfund2SnapshotFields.investorCount),
          totalVolumeETH: parseFloat(xxxfund2SnapshotFields.totalVolumeETH),
          totalVolumeUSD: parseFloat(xxxfund2SnapshotFields.totalVolumeUSD),
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
