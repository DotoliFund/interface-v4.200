import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { FundSnapshot, FundSnapshotFields } from 'types/fund'

const FUND_CHART = gql`
  query fundChartData($fund: String!) {
    fundSnapshots(first: 100, orderBy: timestamp, orderDirection: asc, where: { fund: $fund }, subgraphError: allow) {
      id
      timestamp
      fund
      manager
      investorCount
      principalETH
      principalUSD
      volumeETH
      volumeUSD
      profitETH
      profitUSD
      profitRatioETH
      profitRatioUSD
      feeVolumeETH
      feeVolumeUSD
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
          principalETH: parseFloat(fundSnapshotFields.principalETH),
          principalUSD: parseFloat(fundSnapshotFields.principalUSD),
          volumeETH: parseFloat(fundSnapshotFields.volumeETH),
          volumeUSD: parseFloat(fundSnapshotFields.volumeUSD),
          profitETH: parseFloat(fundSnapshotFields.profitETH),
          profitUSD: parseFloat(fundSnapshotFields.profitUSD),
          profitRatioETH: parseFloat(fundSnapshotFields.profitRatioETH),
          profitRatioUSD: parseFloat(fundSnapshotFields.profitRatioUSD),
          feeVolumeETH: parseFloat(fundSnapshotFields.feeVolumeETH),
          feeVolumeUSD: parseFloat(fundSnapshotFields.feeVolumeUSD),
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
