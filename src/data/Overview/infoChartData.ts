import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

export const INFO_CHART = () => {
  const queryString = `
    query infoSnapshots {
      infoSnapshots(orderBy: date, orderDirection: asc, subgraphError: allow) {
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

export interface InfoChart {
  id: string
  date: number
  fundCount: number
  investorCount: number
  totalCurrentUSD: number
}

export interface InfoChartFields {
  id: string
  date: string
  fundCount: string
  investorCount: string
  totalCurrentUSD: string
}

interface InfoChartResponse {
  infoSnapshots: InfoChartFields[]
}

/**
 * Fetch DotoliInfo chart data
 */
export function useInfoChartData(): {
  loading: boolean
  error: boolean
  data: InfoChart[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<InfoChartResponse>(INFO_CHART(), {
    client: dataClient,
  })

  if (!data || (data && !data.infoSnapshots)) return { data: [], error: false, loading: false }

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

  const formatted: InfoChart[] = data
    ? data.infoSnapshots.map((snapshot, index) => {
        const infoChartData: InfoChart = {
          id: snapshot.id,
          date: parseFloat(snapshot.date),
          fundCount: parseFloat(snapshot.fundCount),
          investorCount: parseFloat(snapshot.investorCount),
          totalCurrentUSD: parseFloat(snapshot.totalCurrentUSD),
        }
        return infoChartData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
