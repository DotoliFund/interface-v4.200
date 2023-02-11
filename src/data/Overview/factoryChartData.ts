import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

export const FACTORY_CHART = () => {
  const queryString = `
    query factorySnapshots {
      factorySnapshots(orderBy: date, orderDirection: asc, subgraphError: allow) {
        id
        date
        fundCount
        investorCount
        totalCurrentUSD
      }
    }
  `
  return gql(queryString)
}

export interface FactoryChart {
  id: string
  date: number
  fundCount: number
  investorCount: number
  totalCurrentUSD: number
}

export interface FactoryChartFields {
  id: string
  date: string
  fundCount: string
  investorCount: string
  totalCurrentUSD: string
}

interface FactoryChartResponse {
  factorySnapshots: FactoryChartFields[]
}

/**
 * Fetch DotoliFund Factory chart data
 */
export function useFactoryChartData(): {
  loading: boolean
  error: boolean
  data: FactoryChart[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<FactoryChartResponse>(FACTORY_CHART(), {
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

  const formatted: FactoryChart[] = data
    ? data.factorySnapshots.map((data2, index) => {
        const factoryChartData: FactoryChart = {
          id: data2.id,
          date: parseFloat(data2.date),
          fundCount: parseFloat(data2.fundCount),
          investorCount: parseFloat(data2.investorCount),
          totalCurrentUSD: parseFloat(data2.totalCurrentUSD),
        }
        return factoryChartData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
