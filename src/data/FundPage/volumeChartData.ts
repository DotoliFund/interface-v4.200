import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

const VOLUME_CHART = gql`
  query volumeChart($fundId: String!) {
    fundSnapshots(
      first: 100
      orderBy: timestamp
      orderDirection: asc
      where: { fundId: $fundId }
      subgraphError: allow
    ) {
      id
      timestamp
      currentUSD
      currentTokens
      currentTokensSymbols
      currentTokensAmountUSD
    }
  }
`

interface VolumeChart {
  id: string
  timestamp: number
  currentUSD: number
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensAmountUSD: number[]
}

interface VolumeChartFields {
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
export function useVolumeChartData(fundId: string | undefined): {
  loading: boolean
  error: boolean
  data: VolumeChart[]
} {
  if (fundId === undefined) {
    fundId = '0'
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<VolumeChartResponse>(VOLUME_CHART, {
    variables: { fundId },
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
    ? data.fundSnapshots.map((snapshot) => {
        const volumeChartData: VolumeChart = {
          id: snapshot.id,
          timestamp: parseInt(snapshot.timestamp),
          currentUSD: parseFloat(snapshot.currentUSD),
          currentTokens: snapshot.currentTokens,
          currentTokensSymbols: snapshot.currentTokensSymbols,
          currentTokensAmountUSD: snapshot.currentTokensAmountUSD.map((value) => {
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
