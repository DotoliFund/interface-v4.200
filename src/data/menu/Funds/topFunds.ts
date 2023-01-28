import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Fund, FundFields } from 'types/fund'

export const TOP_FUNDS = () => {
  const queryString = `
    query funds {
      funds(first: 100, orderBy: volumeUSD, orderDirection: desc, subgraphError: allow) {
        id
        address
        createdAtTimestamp
        manager
        investorCount
        volumeETH
        volumeUSD
        tokens
        symbols
        decimals
        tokensAmount
        tokensVolumeETH
        tokensVolumeUSD
        feeTokens
        feeSymbols
        feeTokensAmount
      }
    }
  `
  return gql(queryString)
}

interface FundResponse {
  funds: FundFields[]
}

/**
 * Fetch top funds by volumeUSD
 */
export function useTopFunds(): {
  loading: boolean
  error: boolean
  data: Fund[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<FundResponse>(TOP_FUNDS(), {
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

  const formatted: Fund[] = data
    ? data.funds.map((value, index) => {
        const fundFields = data.funds[index]
        const fundData: Fund = {
          address: fundFields.address,
          createdAtTimestamp: parseFloat(fundFields.createdAtTimestamp),
          manager: fundFields.manager,
          investorCount: parseInt(fundFields.investorCount),
          volumeETH: parseFloat(fundFields.volumeETH),
          volumeUSD: parseFloat(fundFields.volumeUSD),
          tokens: fundFields.tokens,
          symbols: fundFields.symbols,
          decimals: fundFields.decimals.map((value) => {
            return parseFloat(value)
          }),
          tokensAmount: fundFields.tokensAmount.map((value) => {
            return parseFloat(value)
          }),
          tokensVolumeETH: fundFields.tokensVolumeETH.map((value) => {
            return parseFloat(value)
          }),
          tokensVolumeUSD: fundFields.tokensVolumeUSD.map((value) => {
            return parseFloat(value)
          }),
          feeTokens: fundFields.feeTokens,
          feeSymbols: fundFields.feeSymbols,
          feeTokensAmount: fundFields.feeTokensAmount.map((value) => {
            return parseFloat(value)
          }),
        }
        return fundData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
