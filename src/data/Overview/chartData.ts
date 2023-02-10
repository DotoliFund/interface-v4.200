import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { FactorySnapshot, FactorySnapshotFields } from 'types/fund'

export const FUND_CHART_DATA_BULK = () => {
  const queryString = `
    query factorySnapshots {
      factorySnapshots(orderBy: date, orderDirection: asc, subgraphError: allow) {
        id
        date
        fundCount
        investorCount
        totalCurrentETH
        totalCurrentUSD
      }
    }
  `
  return gql(queryString)
}

interface FactorySnapshotResponse {
  factorySnapshots: FactorySnapshotFields[]
}

/**
 * Fetch DotoliFund Factory chart data
 */
export function useFactoryChartData(): {
  loading: boolean
  error: boolean
  data: FactorySnapshot[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<FactorySnapshotResponse>(FUND_CHART_DATA_BULK(), {
    client: dataClient,
  })

  if (!data || (data && !data.factorySnapshots)) return { data: [], error: false, loading: false }

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

  const formatted: FactorySnapshot[] = data
    ? data.factorySnapshots.map((value, index) => {
        const factorySnapshotFields = data.factorySnapshots[index]
        const fundSnapshotData: FactorySnapshot = {
          id: factorySnapshotFields.id,
          date: parseFloat(factorySnapshotFields.date),
          fundCount: parseFloat(factorySnapshotFields.fundCount),
          investorCount: parseFloat(factorySnapshotFields.investorCount),
          totalCurrentETH: parseFloat(factorySnapshotFields.totalCurrentETH),
          totalCurrentUSD: parseFloat(factorySnapshotFields.totalCurrentUSD),
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
