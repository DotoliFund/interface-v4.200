import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

const VOLUME_CHART = gql`
  query volumeChart($fund: Bytes!) {
    fundSnapshots(first: 100, orderBy: timestamp, orderDirection: asc, where: { fund: $fund }, subgraphError: allow) {
      id
      timestamp
      currentUSD
      currentTokens
      currentTokensSymbols
      currentTokensAmountUSD
    }
  }
`

export interface VolumeChart {
  id: string
  timestamp: number
  currentUSD: number
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensAmountUSD: number[]
}

export interface VolumeChartFields {
  id: string
  timestamp: string
  currentUSD: string
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensAmountUSD: string[]
}

interface VolumeChartResponse {
  fundSnapshots: VolumeChartFields[]
}

/**
 * Fetch fund volume chart data
 */
export function useVolumeChartData(fund: string | undefined): {
  loading: boolean
  error: boolean
  data: VolumeChart[]
} {
  if (!fund) {
    fund = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<VolumeChartResponse>(VOLUME_CHART, {
    variables: { fund },
    client: dataClient,
  })

  if (!data || (data && !data.fundSnapshots)) return { data: [], error: false, loading: false }

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

  const formatted: VolumeChart[] = data
    ? data.fundSnapshots.map((data2, index) => {
        const volumeChartData: VolumeChart = {
          id: data2.id,
          timestamp: parseFloat(data2.timestamp),
          currentUSD: parseFloat(data2.currentUSD),
          currentTokens: data2.currentTokens,
          currentTokensSymbols: data2.currentTokensSymbols,
          currentTokensAmountUSD: data2.currentTokensAmountUSD.map((value) => {
            return parseFloat(value)
          }),
        }
        return volumeChartData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
