import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { FundSnapshot, FundSnapshotFields } from 'types/fund'

const FUND_CHART = gql`
  query fundChartData($fund: Bytes!) {
    fundSnapshots(first: 100, orderBy: timestamp, orderDirection: asc, where: { fund: $fund }, subgraphError: allow) {
      id
      timestamp
      fund
      manager
      investorCount
      currentETH
      currentUSD
      currentTokens
      currentTokensSymbols
      currentTokensDecimals
      currentTokensAmountETH
      currentTokensAmountUSD
    }
  }
`

interface FundSnapshotResponse {
  fundSnapshots: FundSnapshotFields[]
}

/**
 * Fetch fund chart data
 */
export function useFundChartData(fund: string | undefined): {
  loading: boolean
  error: boolean
  data: FundSnapshot[]
} {
  if (!fund) {
    fund = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<FundSnapshotResponse>(FUND_CHART, {
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

  const formatted: FundSnapshot[] = data
    ? data.fundSnapshots.map((value, index) => {
        const fundSnapshotFields = data.fundSnapshots[index]
        const fundSnapshotData: FundSnapshot = {
          id: fundSnapshotFields.id,
          timestamp: parseFloat(fundSnapshotFields.timestamp),
          fund: fundSnapshotFields.fund,
          manager: fundSnapshotFields.manager,
          investorCount: parseFloat(fundSnapshotFields.investorCount),
          currentETH: parseFloat(fundSnapshotFields.currentETH),
          currentUSD: parseFloat(fundSnapshotFields.currentUSD),
          currentTokens: fundSnapshotFields.currentTokens,
          currentTokensSymbols: fundSnapshotFields.currentTokensSymbols,
          currentTokensDecimals: fundSnapshotFields.currentTokensDecimals.map((value) => {
            return parseFloat(value)
          }),
          currentTokensAmountETH: fundSnapshotFields.currentTokensAmountETH.map((value) => {
            return parseFloat(value)
          }),
          currentTokensAmountUSD: fundSnapshotFields.currentTokensAmountUSD.map((value) => {
            return parseFloat(value)
          }),
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
