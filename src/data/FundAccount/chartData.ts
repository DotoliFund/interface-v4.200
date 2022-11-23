import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { InvestorSnapshot, InvestorSnapshotFields } from 'types/fund'

const INVESTOR_CHART = gql`
  query investorChartData($fund: String!, $investor: String!) {
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
      manager
      investor
      principalUSD
      volumeETH
      volumeUSD
      tokens
      symbols
      tokensVolumeUSD
    }
  }
`

interface InvestorSnapshotResponse {
  investorSnapshots: InvestorSnapshotFields[]
}

/**
 * Fetch investor chart data
 */
export function useInvestorChartData(
  fund: string | undefined,
  investor: string | undefined
): {
  loading: boolean
  error: boolean
  data: InvestorSnapshot[]
} {
  if (!fund) {
    fund = NULL_ADDRESS
  }
  if (!investor) {
    investor = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<InvestorSnapshotResponse>(INVESTOR_CHART, {
    variables: { fund, investor },
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
          volumeETH: parseFloat(investorSnapshotFields.volumeETH),
          volumeUSD: parseFloat(investorSnapshotFields.volumeUSD),
          tokens: investorSnapshotFields.tokens,
          symbols: investorSnapshotFields.symbols,
          tokensVolumeUSD: investorSnapshotFields.tokensVolumeUSD.map((value) => {
            return parseFloat(value)
          }),
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
