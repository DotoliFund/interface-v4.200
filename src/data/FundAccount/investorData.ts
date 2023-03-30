import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

const INVESTOR_DATA = gql`
  query investor($id: String!) {
    investor(id: $id, subgraphError: allow) {
      id
      fundId
      investor
      isManager
      currentTokens
      currentTokensSymbols
      currentTokensDecimals
      currentTokensAmount
    }
  }
`

export interface Investor {
  id: string
  fundId: string
  investor: string
  isManager: boolean
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensDecimals: number[]
  currentTokensAmount: number[]
}

export interface InvestorFields {
  id: string
  fundId: string
  investor: string
  isManager: string
  currentTokens: string[]
  currentTokensSymbols: string[]
  currentTokensDecimals: string[]
  currentTokensAmount: string[]
}

interface InvestorResponse {
  investor: InvestorFields
}

/**
 * Fetch investor data
 */
export function useInvestorData(
  fundId: string | undefined,
  investor: string | undefined
): {
  loading: boolean
  error: boolean
  data: Investor | undefined
} {
  if (fundId === undefined) {
    fundId = '0'
  }
  if (!investor) {
    investor = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const id = fundId + '-' + investor.toUpperCase()
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
        id: data.investor.id,
        fundId: data.investor.fundId,
        investor: data.investor.investor,
        isManager: Boolean(data.investor.isManager),
        currentTokens: data.investor.currentTokens,
        currentTokensSymbols: data.investor.currentTokensSymbols,
        currentTokensDecimals: data.investor.currentTokensDecimals.map((value) => {
          return parseFloat(value)
        }),
        currentTokensAmount: data.investor.currentTokensAmount.map((value) => {
          return parseFloat(value)
        }),
      }
    : undefined

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
