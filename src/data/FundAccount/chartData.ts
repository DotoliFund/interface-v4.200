import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { InvestorSnapshot, InvestorSnapshotFields } from 'types/fund'

export const INVESTOR_CHART = (fund: string, investor: string) => {
  const queryString = `
    query investorChartData {
      investorSnapshots(first: 100, orderBy: timestamp, orderDirection: asc, where: {fund: ${fund}, investor: ${investor}}, subgraphError: allow) {
        id
        timestamp
        fund
        manager
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

interface InvestorSnapshotResponse {
  investorSnapshots: InvestorSnapshotFields[]
}

/**
 * Fetch investor chart data
 */
export function useInvestorChartData(
  fund: string,
  investor: string
): {
  loading: boolean
  error: boolean
  data: InvestorSnapshot[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<InvestorSnapshotResponse>(INVESTOR_CHART(fund, investor), {
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

  const formatted: InvestorSnapshot[] = data
    ? data.investorSnapshots.map((value, index) => {
        const investorSnapshotFields = data.investorSnapshots[index]
        const investorSnapshotData: InvestorSnapshot = {
          id: investorSnapshotFields.id,
          timestamp: parseFloat(investorSnapshotFields.timestamp),
          fund: investorSnapshotFields.fund,
          manager: investorSnapshotFields.manager,
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
