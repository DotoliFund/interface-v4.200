import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Manager, ManagerFields } from 'types/fund'

export const MANAGER_DATA = (manager: string) => {
  const queryString = `
    query manager {
      manager(where: {manager: ${manager}}, subgraphError: allow) {
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
        feeVolumeETH
        feeVolumeUSD
      }
    }
    `
  return gql(queryString)
}

interface ManagerResponse {
  manager: ManagerFields[]
}

/**
 * Fetch manager data
 */
export function useManagerData(manager: string): {
  loading: boolean
  error: boolean
  data: Manager[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<ManagerResponse>(MANAGER_DATA(manager), {
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

  const formatted: Manager[] = data
    ? data.manager.map((value, index) => {
        const managerDataFields = data.manager[index]
        const managerData: Manager = {
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
          feeVolumeETH: parseFloat(managerDataFields.profitRatioUSD),
          feeVolumeUSD: parseFloat(managerDataFields.profitRatioUSD),
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
