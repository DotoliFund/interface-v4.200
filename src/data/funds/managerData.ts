import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

export const MANAGER_DATA = () => {
  const queryString = `
    query manager {
      manager(id: manager, subgraphError: allow) {
        id
        createdAtTimestamp
        createdAtBlockNumber
        fund
        principalETH
        principalUSD
        volumeETH
        volumeUSD
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

export const MANAGER_SNAPSHOTS_BULK = () => {
  const queryString = `
    query managerSnpashots {
      managerSnpashots(fund: fundAddress, manager: account, orderBy: createdAtTimestamp, orderDirection: desc, subgraphError: allow) {
        id
        timestamp: number
        fund: string
        manager: string
        principalETH
        principalUSD
        volumeETH
        volumeUSD
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

export interface ManagerData {
  address: string
  createdAtTimestamp: number
  createdAtBlockNumber: number
  fund: string
  principalETH: number
  principalUSD: number
  volumeETH: number
  volumeUSD: number
  profitETH: number
  profitUSD: number
  profitRatioETH: number
  profitRatioUSD: number
  feeVolumeUSD: number
  feeVolumeETH: number
}

export interface ManagerSnapshotData {
  id: string
  timestamp: number
  fund: string
  manager: string
  principalUSD: number
  principalETH: number
  volumeUSD: number
  volumeETH: number
  profitETH: number
  profitUSD: number
  profitRatioETH: number
  profitRatioUSD: number
  feeVolumeUSD: number
  feeVolumeETH: number
}

interface ManagerDataFields {
  id: string
  createdAtTimestamp: string
  createdAtBlockNumber: string
  fund: string
  principalETH: string
  principalUSD: string
  volumeETH: string
  volumeUSD: string
  profitETH: string
  profitUSD: string
  profitRatioETH: string
  profitRatioUSD: string
  feeVolumeUSD: string
  feeVolumeETH: string
}

interface ManagerSnapshotFields {
  id: string
  timestamp: string
  fund: string
  manager: string
  principalUSD: string
  principalETH: string
  volumeUSD: string
  volumeETH: string
  profitETH: string
  profitUSD: string
  profitRatioETH: string
  profitRatioUSD: string
  feeVolumeUSD: string
  feeVolumeETH: string
}

interface ManagerDataResponse {
  managerData: ManagerDataFields[]
}

interface ManagerSnapshotsResponse {
  managerSnapshots: ManagerSnapshotFields[]
}

/**
 * Fetch ManagerData
 */
export function useManagerData(): {
  loading: boolean
  error: boolean
  data: ManagerData[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<ManagerDataResponse>(MANAGER_DATA(), {
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

  const formatted: ManagerData[] = data
    ? data.managerData.map((value, index) => {
        const managerDataFields = data.managerData[index]
        const managerData: ManagerData = {
          address: managerDataFields.id,
          createdAtTimestamp: parseFloat(managerDataFields.createdAtTimestamp),
          createdAtBlockNumber: parseFloat(managerDataFields.createdAtBlockNumber),
          fund: managerDataFields.fund,
          principalETH: parseFloat(managerDataFields.principalETH),
          principalUSD: parseFloat(managerDataFields.principalUSD),
          volumeETH: parseFloat(managerDataFields.volumeETH),
          volumeUSD: parseFloat(managerDataFields.volumeUSD),
          profitETH: parseFloat(managerDataFields.profitETH),
          profitUSD: parseFloat(managerDataFields.profitUSD),
          profitRatioETH: parseFloat(managerDataFields.profitRatioETH),
          profitRatioUSD: parseFloat(managerDataFields.profitRatioUSD),
          feeVolumeUSD: parseFloat(managerDataFields.feeVolumeUSD),
          feeVolumeETH: parseFloat(managerDataFields.feeVolumeETH),
        }
        return managerData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}

/**
 * Fetch ManagerSnapshots
 */
export function useManagerSnapshotDatas(): {
  loading: boolean
  error: boolean
  data: ManagerSnapshotData[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<ManagerSnapshotsResponse>(MANAGER_SNAPSHOTS_BULK(), {
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

  const formatted: ManagerSnapshotData[] = data
    ? data.managerSnapshots.map((value, index) => {
        const managerSnapshotFields = data.managerSnapshots[index]
        const managerSnapshotData: ManagerSnapshotData = {
          id: managerSnapshotFields.id,
          timestamp: parseFloat(managerSnapshotFields.timestamp),
          fund: managerSnapshotFields.fund,
          manager: managerSnapshotFields.manager,
          principalETH: parseFloat(managerSnapshotFields.principalETH),
          principalUSD: parseFloat(managerSnapshotFields.principalUSD),
          volumeETH: parseFloat(managerSnapshotFields.volumeETH),
          volumeUSD: parseFloat(managerSnapshotFields.volumeUSD),
          profitETH: parseFloat(managerSnapshotFields.profitETH),
          profitUSD: parseFloat(managerSnapshotFields.profitUSD),
          profitRatioETH: parseFloat(managerSnapshotFields.profitRatioETH),
          profitRatioUSD: parseFloat(managerSnapshotFields.profitRatioUSD),
          feeVolumeUSD: parseFloat(managerSnapshotFields.feeVolumeUSD),
          feeVolumeETH: parseFloat(managerSnapshotFields.feeVolumeETH),
        }
        return managerSnapshotData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
