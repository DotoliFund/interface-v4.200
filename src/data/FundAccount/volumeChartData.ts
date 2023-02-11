import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

const VOLUME_CHART = gql`
  query volumeChart($fund: String!, $investor: String!) {
    investorSnapshots(
      first: 100
      orderBy: timestamp
      orderDirection: asc
      where: { fund: $fund, investor: $investor }
      subgraphError: allow
    ) {
      id
      timestamp
      fund
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
  fund: string
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
  fund: string
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
  fund: string | undefined,
  investor: string | undefined
): {
  loading: boolean
  error: boolean
  data: VolumeChart[]
} {
  if (!fund) {
    fund = NULL_ADDRESS
  }
  if (!investor) {
    investor = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<VolumeChartResponse>(VOLUME_CHART, {
    variables: { fund, investor },
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
    ? data.investorSnapshots.map((data2, index) => {
        const volumeChartData: VolumeChart = {
          id: data2.id,
          timestamp: parseFloat(data2.timestamp),
          fund: data2.fund,
          investor: data2.investor,
          currentUSD: parseFloat(data2.currentUSD),
          poolUSD: parseFloat(data2.poolUSD),
          principalUSD: parseFloat(data2.principalUSD),
          tokens: data2.tokens,
          tokensSymbols: data2.tokensSymbols,
          tokensAmountUSD: data2.tokensAmountUSD.map((value) => {
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
