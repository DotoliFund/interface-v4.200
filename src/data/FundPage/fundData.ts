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
      manager
      investorCount
      principalETH
      principalUSD
      volumeETH
      volumeUSD
      liquidityVolumeETH
      liquidityVolumeUSD
      feeVolumeETH
      feeVolumeUSD
      tokens
      symbols
      tokensAmount
      tokensVolumeETH
      tokensVolumeUSD
      profitETH
      profitUSD
      profitRatio
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

  if (!data || (data && !data.fund)) return { data: undefined, error: false, loading: false }

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
        manager: data.fund.manager,
        investorCount: parseInt(data.fund.investorCount),
        principalETH: parseFloat(data.fund.principalETH),
        principalUSD: parseFloat(data.fund.principalUSD),
        volumeETH: parseFloat(data.fund.volumeETH),
        volumeUSD: parseFloat(data.fund.volumeUSD),
        liquidityVolumeETH: parseFloat(data.fund.liquidityVolumeETH),
        liquidityVolumeUSD: parseFloat(data.fund.liquidityVolumeUSD),
        feeVolumeETH: parseFloat(data.fund.feeVolumeETH),
        feeVolumeUSD: parseFloat(data.fund.feeVolumeUSD),
        tokens: data.fund.tokens,
        symbols: data.fund.symbols,
        tokensAmount: data.fund.tokensAmount.map((value) => {
          return parseFloat(value)
        }),
        tokensVolumeETH: data.fund.tokensVolumeETH.map((value) => {
          return parseFloat(value)
        }),
        tokensVolumeUSD: data.fund.tokensVolumeUSD.map((value) => {
          return parseFloat(value)
        }),
        profitETH: parseFloat(data.fund.profitETH),
        profitUSD: parseFloat(data.fund.profitUSD),
        profitRatio: parseFloat(data.fund.profitRatio),
      }
    : undefined

  return { data: formatted, error: false, loading: false }
}
