import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Fund, FundFields } from 'types/fund'

const FUND_DATA = gql`
  query fund($fund: Bytes!) {
    fund(id: $fund, subgraphError: allow) {
      id
      address
      createdAtTimestamp
      createdAtBlockNumber
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

interface FundResponse {
  fund: FundFields
}

/**
 * Fetch top funds by profit
 */
export function useFundData(fund: string | undefined): {
  loading: boolean
  error: boolean
  data: Fund | undefined
} {
  if (!fund) {
    fund = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<FundResponse>(FUND_DATA, {
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
      data: undefined,
    }
  }

  const formatted: Fund | undefined = data
    ? {
        address: data.fund.address,
        createdAtTimestamp: parseFloat(data.fund.createdAtTimestamp),
        createdAtBlockNumber: parseFloat(data.fund.createdAtBlockNumber),
        manager: data.fund.manager,
        investorCount: parseInt(data.fund.investorCount),
        principalETH: parseFloat(data.fund.principalETH),
        principalUSD: parseFloat(data.fund.principalUSD),
        volumeETH: parseFloat(data.fund.volumeETH),
        volumeUSD: parseFloat(data.fund.volumeUSD),
        profitETH: parseFloat(data.fund.profitETH),
        profitUSD: parseFloat(data.fund.profitUSD),
        profitRatioETH: parseFloat(data.fund.profitRatioETH),
        profitRatioUSD: parseFloat(data.fund.profitRatioUSD),
        feeVolumeETH: parseFloat(data.fund.feeVolumeETH),
        feeVolumeUSD: parseFloat(data.fund.feeVolumeUSD),
      }
    : undefined

  return { data: formatted, error: false, loading: false }
}
