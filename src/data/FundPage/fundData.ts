import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

const FUND_DATA = gql`
  query fundData($fundId: String!) {
    fund(id: $fundId, subgraphError: allow) {
      id
      fundId
      createdAtTimestamp
      updatedAtTimestamp
      manager
      investorCount
      currentUSD
      currentTokens
      currentTokensSymbols
      currentTokensDecimals
      currentTokensAmount
      feeTokens
      feeSymbols
      feeTokensAmount
    }
  }
`

interface Fund {
  id: string
  fundId: string
  createdAtTimestamp: number
  updatedAtTimestamp: number
  manager: string
  investorCount: number
  currentUSD: number
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensDecimals: number[]
  currentTokensAmount: number[]
  feeTokens: string[]
  feeSymbols: string[]
  feeTokensAmount: number[]
}

interface FundFields {
  id: string
  fundId: string
  createdAtTimestamp: string
  updatedAtTimestamp: string
  manager: string
  investorCount: string
  currentUSD: string
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensDecimals: string[]
  currentTokensAmount: string[]
  feeTokens: string[]
  feeSymbols: string[]
  feeTokensAmount: string[]
}

interface FundResponse {
  fund: FundFields
}

/**
 * Fetch top funds by profit
 */
export function useFundData(fundId: string | undefined): {
  loading: boolean
  error: boolean
  data: Fund | undefined
} {
  if (fundId === undefined) {
    fundId = '0'
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<FundResponse>(FUND_DATA, {
    variables: { fundId },
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
        id: data.fund.id,
        fundId: data.fund.fundId,
        createdAtTimestamp: parseInt(data.fund.createdAtTimestamp),
        updatedAtTimestamp: parseInt(data.fund.updatedAtTimestamp),
        manager: data.fund.manager,
        investorCount: parseInt(data.fund.investorCount),
        currentUSD: parseFloat(data.fund.currentUSD),
        currentTokens: data.fund.currentTokens,
        currentTokensSymbols: data.fund.currentTokensSymbols,
        currentTokensDecimals: data.fund.currentTokensDecimals.map((value) => {
          return parseFloat(value)
        }),
        currentTokensAmount: data.fund.currentTokensAmount.map((value) => {
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
