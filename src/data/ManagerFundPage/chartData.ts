import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { ManagerSnapshot, ManagerSnapshotFields } from 'types/fund'

export const MANAGER_CHART = (manager: string) => {
  const queryString = `
    query managerChartData {
      managerSnapshots(where: {manager: ${manager}}, orderBy: timestamp, orderDirection: asc, subgraphError: allow) {
        id
        timestamp
        fund
        manager
        principalUSD
        principalETH
        volumeUSD
        volumeETH
        profitETH
        profitUSD
        profitRatioETH
        profitRatioUSD
        feeVolumeUSD
        feeVolumeETH
      }
    }
    `
  return gql(queryString)
}

interface ManagerSnapshotResponse {
  managerSnapshots: ManagerSnapshotFields[]
}

/**
 * Fetch manager chart data
 */
export function useManagerChartData(manager: string): {
  loading: boolean
  error: boolean
  data: ManagerSnapshot[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<ManagerSnapshotResponse>(MANAGER_CHART(manager), {
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

  const formatted: ManagerSnapshot[] = data
    ? data.managerSnapshots.map((value, index) => {
        const managerSnapshotFields = data.managerSnapshots[index]
        const managerSnapshot: ManagerSnapshot = {
          id: managerSnapshotFields.id,
          timestamp: parseFloat(managerSnapshotFields.timestamp),
          fund: managerSnapshotFields.fund,
          manager: managerSnapshotFields.manager,
          principalUSD: parseFloat(managerSnapshotFields.principalUSD),
          principalETH: parseFloat(managerSnapshotFields.principalETH),
          volumeUSD: parseFloat(managerSnapshotFields.volumeUSD),
          volumeETH: parseFloat(managerSnapshotFields.volumeETH),
          profitETH: parseFloat(managerSnapshotFields.profitETH),
          profitUSD: parseFloat(managerSnapshotFields.profitUSD),
          profitRatioETH: parseFloat(managerSnapshotFields.profitRatioETH),
          profitRatioUSD: parseFloat(managerSnapshotFields.profitRatioUSD),
          feeVolumeUSD: parseFloat(managerSnapshotFields.feeVolumeUSD),
          feeVolumeETH: parseFloat(managerSnapshotFields.feeVolumeETH),
        }
        return managerSnapshot
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
