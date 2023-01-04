import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Token, TokenFields } from 'types/fund'

export const TOKENS_BULK = () => {
  const queryString = `
    query tokens {
      tokens(first: 100, orderBy: id, orderDirection: asc, where: { active: true }, subgraphError: allow) {
        id
        address
        symbol
        updatedTimestamp
      }
    }
  `
  return gql(queryString)
}

interface TokenDataResponse {
  tokens: TokenFields[]
}

/**
 * Fetch tokens
 */
export function useTokenList(): {
  loading: boolean
  error: boolean
  data: Token[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<TokenDataResponse>(TOKENS_BULK(), {
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

  const formatted: Token[] = data
    ? data.tokens.map((value, index) => {
        const tokenFields = data.tokens[index]
        const tokenData: Token = {
          address: tokenFields.address,
          symbol: tokenFields.symbol,
          updatedTimestamp: tokenFields.updatedTimestamp,
        }
        return tokenData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
