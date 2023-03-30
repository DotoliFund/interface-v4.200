import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

const VOLUME_CHART = gql`
  query volumeChart($fundId: String!, $investor: String!) {
    investorSnapshots(
      first: 100
      orderBy: timestamp
      orderDirection: asc
      where: { fundId: $fundId, investor: $investor }
      subgraphError: allow
    ) {
      id
      timestamp
      fundId
      investor
      currentUSD
      poolUSD
      principalUSD
      tokens
      tokensSymbols
      tokensAmountUSD
    }
  }
`

export interface VolumeChart {
  id: string
  timestamp: number
  fundId: string
  investor: string
  currentUSD: number
  poolUSD: number
  principalUSD: number
  tokens: string[]
  tokensSymbols: string[]
  tokensAmountUSD: number[]
}

export interface VolumeChartFields {
  id: string
  timestamp: string
  fundId: string
  investor: string
  currentUSD: string
  poolUSD: string
  principalUSD: string
  tokens: string[]
  tokensSymbols: string[]
  tokensAmountUSD: string[]
}

interface VolumeChartResponse {
  investorSnapshots: VolumeChartFields[]
}

/**
 * Fetch investor chart data
 */
export function useVolumeChartData(
  fundId: string | undefined,
  investor: string | undefined
): {
  loading: boolean
  error: boolean
  data: VolumeChart[]
} {
  if (fundId === undefined) {
    fundId = '0'
  }
  if (!investor) {
    investor = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<VolumeChartResponse>(VOLUME_CHART, {
    variables: { fundId, investor },
    client: dataClient,
  })

  if (!data || (data && !data.investorSnapshots)) return { data: [], error: false, loading: false }

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
    ? data.investorSnapshots.map((snapshot, index) => {
        const volumeChartData: VolumeChart = {
          id: snapshot.id,
          timestamp: parseInt(snapshot.timestamp),
          fundId: snapshot.fundId,
          investor: snapshot.investor,
          currentUSD: parseFloat(snapshot.currentUSD),
          poolUSD: parseFloat(snapshot.poolUSD),
          principalUSD: parseFloat(snapshot.principalUSD),
          tokens: snapshot.tokens,
          tokensSymbols: snapshot.tokensSymbols,
          tokensAmountUSD: snapshot.tokensAmountUSD.map((value) => {
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
