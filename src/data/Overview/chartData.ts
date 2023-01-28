import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { DotoliFundSnapshot, DotoliFundSnapshotFields } from 'types/fund'

export const FUND_CHART_DATA_BULK = () => {
  const queryString = `
    query dotoliFundSnapshots {
      dotoliFundSnapshots(orderBy: timestamp, orderDirection: asc, subgraphError: allow) {
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

interface DotoliFundSnapshotResponse {
  dotoliFundSnapshots: DotoliFundSnapshotFields[]
}

/**
 * Fetch dotoli chart data
 */
export function useDotoliFundChartData(): {
  loading: boolean
  error: boolean
  data: DotoliFundSnapshot[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<DotoliFundSnapshotResponse>(FUND_CHART_DATA_BULK(), {
    client: dataClient,
  })

  if (!data || (data && !data.dotoliFundSnapshots)) return { data: [], error: false, loading: false }

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

  const formatted: DotoliFundSnapshot[] = data
    ? data.dotoliFundSnapshots.map((value, index) => {
        const dotolifundSnapshotFields = data.dotoliFundSnapshots[index]
        const fundSnapshotData: DotoliFundSnapshot = {
          id: dotolifundSnapshotFields.id,
          timestamp: parseFloat(dotolifundSnapshotFields.timestamp),
          fundCount: parseFloat(dotolifundSnapshotFields.fundCount),
          investorCount: parseFloat(dotolifundSnapshotFields.investorCount),
          totalVolumeETH: parseFloat(dotolifundSnapshotFields.totalVolumeETH),
          totalVolumeUSD: parseFloat(dotolifundSnapshotFields.totalVolumeUSD),
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
