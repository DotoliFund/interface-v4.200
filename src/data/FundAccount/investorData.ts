import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Investor, InvestorFields } from 'types/fund'

const INVESTOR_DATA = gql`
  query investor($id: String!) {
    investor(id: $id, subgraphError: allow) {
      id
      createdAtTimestamp
      fund
      investor
      isManager
      principalETH
      principalUSD
      currentETH
      currentUSD
      currentTokens
      currentTokensSymbols
      currentTokensDecimals
      currentTokensAmount
      currentTokensAmountETH
      currentTokensAmountUSD
      tokenIds
      profitETH
      profitUSD
      profitRatio
    }
  }
`

interface InvestorResponse {
  investor: InvestorFields
}

/**
 * Fetch top funds by profit
 */
export function useInvestorData(
  fund: string | undefined,
  investor: string | undefined
): {
  loading: boolean
  error: boolean
  data: Investor | undefined
} {
  if (!fund) {
    fund = NULL_ADDRESS
  }
  if (!investor) {
    investor = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const id = fund.toUpperCase() + '-' + investor.toUpperCase()
  const { loading, error, data } = useQuery<InvestorResponse>(INVESTOR_DATA, {
    variables: { id },
    client: dataClient,
  })

  if (!data || (data && !data.investor)) return { data: undefined, error: false, loading: false }

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

  const formatted: Investor | undefined = data
    ? {
        createdAtTimestamp: parseFloat(data.investor.createdAtTimestamp),
        fund: data.investor.fund,
        investor: data.investor.investor,
        isManager: Boolean(data.investor.isManager),
        principalETH: parseFloat(data.investor.principalETH),
        principalUSD: parseFloat(data.investor.principalUSD),
        currentETH: parseFloat(data.investor.currentETH),
        currentUSD: parseFloat(data.investor.currentUSD),
        currentTokens: data.investor.currentTokens,
        currentTokensSymbols: data.investor.currentTokensSymbols,
        currentTokensDecimals: data.investor.currentTokensDecimals.map((value) => {
          return parseFloat(value)
        }),
        currentTokensAmount: data.investor.currentTokensAmount.map((value) => {
          return parseFloat(value)
        }),
        currentTokensAmountETH: data.investor.currentTokensAmountETH.map((value) => {
          return parseFloat(value)
        }),
        currentTokensAmountUSD: data.investor.currentTokensAmountUSD.map((value) => {
          return parseFloat(value)
        }),
        tokenIds: data.investor.tokenIds.map((value) => {
          return parseFloat(value)
        }),
        profitETH: parseFloat(data.investor.profitETH),
        profitUSD: parseFloat(data.investor.profitUSD),
        profitRatio: parseFloat(data.investor.profitRatio),
      }
    : undefined

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
