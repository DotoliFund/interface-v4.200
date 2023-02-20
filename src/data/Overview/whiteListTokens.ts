import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Token } from 'types/fund'

export const WHITELIST_TOKENS = () => {
  const queryString = `
    query whiteListTokens {
      tokens(first: 100, orderBy: id, orderDirection: asc, where: { active: true }, subgraphError: allow) {
        id
        address
        decimals
        symbol
        updatedTimestamp
      }
    }
  `
  return gql(queryString)
}

export interface WhiteListTokenFields {
  id: string
  address: string
  decimals: string
  symbol: string
  updatedTimestamp: string
}

interface WhiteListTokenResponse {
  tokens: WhiteListTokenFields[]
}

/**
 * Fetch whiteList tokens
 */
export function useWhiteListTokens(): {
  loading: boolean
  error: boolean
  data: Token[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<WhiteListTokenResponse>(WHITELIST_TOKENS(), {
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
    ? data.tokens.map((token, index) => {
        const tokenData: Token = {
          address: token.address,
          decimals: token.decimals,
          symbol: token.symbol,
          updatedTimestamp: token.updatedTimestamp,
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
