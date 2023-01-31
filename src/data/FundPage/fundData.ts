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
      currentETH
      currentUSD
      currentTokens
      currentTokensSymbols
      currentTokensDecimals
      currentTokensAmount
      currentTokensAmountETH
      currentTokensAmountUSD
      feeTokens
      feeSymbols
      feeTokensAmount
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
        currentETH: parseFloat(data.fund.currentETH),
        currentUSD: parseFloat(data.fund.currentUSD),
        currentTokens: data.fund.currentTokens,
        currentTokensSymbols: data.fund.currentTokensSymbols,
        currentTokensDecimals: data.fund.currentTokensDecimals.map((value) => {
          return parseFloat(value)
        }),
        currentTokensAmount: data.fund.currentTokensAmount.map((value) => {
          return parseFloat(value)
        }),
        currentTokensAmountETH: data.fund.currentTokensAmountETH.map((value) => {
          return parseFloat(value)
        }),
        currentTokensAmountUSD: data.fund.currentTokensAmountUSD.map((value) => {
          return parseFloat(value)
        }),
        feeTokens: data.fund.feeTokens,
        feeSymbols: data.fund.feeSymbols,
        feeTokensAmount: data.fund.feeTokensAmount.map((value) => {
          return parseFloat(value)
        }),
      }
    : undefined

  return { data: formatted, error: false, loading: false }
}
