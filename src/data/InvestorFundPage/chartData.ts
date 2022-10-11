import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

export const INVESTOR_CHART_DATA_BULK = () => {
  const queryString = `
    query investorChartData {
      investorSnapshots(orderBy: timestamp, orderDirection: asc, subgraphError: allow) {
        id
        timestamp
        fund
        investor
        principalUSD
        principalETH
        volumeUSD
        volumeETH
        profitETH
        profitUSD
        profitRatioETH
        profitRatioUSD
      }
    }
    `
  return gql(queryString)
}

export interface InvestorSnapshotData {
  id: string
  timestamp: number
  fund: string
  investor: string
  principalUSD: number
  principalETH: number
  volumeUSD: number
  volumeETH: number
  profitETH: number
  profitUSD: number
  profitRatioETH: number
  profitRatioUSD: number
}

interface InvestorSnapshotFields {
  id: string
  timestamp: string
  fund: string
  investor: string
  principalUSD: string
  principalETH: string
  volumeUSD: string
  volumeETH: string
  profitETH: string
  profitUSD: string
  profitRatioETH: string
  profitRatioUSD: string
}

interface InvestorSnapshotDataResponse {
  investorSnapshots: InvestorSnapshotFields[]
}

/**
 * Fetch top funds by profit
 */
export function useTopFunds(): {
  loading: boolean
  error: boolean
  data: InvestorSnapshotData[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<InvestorSnapshotDataResponse>(INVESTOR_CHART_DATA_BULK(), {
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

  const formatted: InvestorSnapshotData[] = data
    ? data.investorSnapshots.map((value, index) => {
        const investorSnapshotFields = data.investorSnapshots[index]
        const investorSnapshotData: InvestorSnapshotData = {
          id: investorSnapshotFields.id,
          timestamp: parseFloat(investorSnapshotFields.timestamp),
          fund: investorSnapshotFields.fund,
          investor: investorSnapshotFields.investor,
          principalUSD: parseFloat(investorSnapshotFields.principalUSD),
          principalETH: parseFloat(investorSnapshotFields.principalETH),
          volumeUSD: parseFloat(investorSnapshotFields.volumeUSD),
          volumeETH: parseFloat(investorSnapshotFields.volumeETH),
          profitETH: parseFloat(investorSnapshotFields.profitETH),
          profitUSD: parseFloat(investorSnapshotFields.profitUSD),
          profitRatioETH: parseFloat(investorSnapshotFields.profitRatioETH),
          profitRatioUSD: parseFloat(investorSnapshotFields.profitRatioUSD),
        }
        return investorSnapshotData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
