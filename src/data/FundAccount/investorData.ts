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
      manager
      investor
      principalETH
      principalUSD
      volumeETH
      volumeUSD
      liquidityVolumeETH
      liquidityVolumeUSD
      tokens
      symbols
      tokensAmount
      tokensVolumeETH
      tokensVolumeUSD
      liquidityTokens
      liquiditySymbols
      liquidityTokensAmount
      liquidityTokensVolumeETH
      liquidityTokensVolumeUSD
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
        id: data.investor.id,
        createdAtTimestamp: parseFloat(data.investor.createdAtTimestamp),
        fund: data.investor.fund,
        manager: data.investor.manager,
        investor: data.investor.investor,
        principalETH: parseFloat(data.investor.principalETH),
        principalUSD: parseFloat(data.investor.principalUSD),
        volumeETH: parseFloat(data.investor.volumeETH),
        volumeUSD: parseFloat(data.investor.volumeUSD),
        liquidityVolumeETH: parseFloat(data.investor.liquidityVolumeETH),
        liquidityVolumeUSD: parseFloat(data.investor.liquidityVolumeUSD),
        tokens: data.investor.tokens,
        symbols: data.investor.symbols,
        tokensAmount: data.investor.tokensAmount.map((value) => {
          return parseFloat(value)
        }),
        tokensVolumeETH: data.investor.tokensVolumeETH.map((value) => {
          return parseFloat(value)
        }),
        tokensVolumeUSD: data.investor.tokensVolumeUSD.map((value) => {
          return parseFloat(value)
        }),
        liquidityTokens: data.investor.liquidityTokens,
        liquiditySymbols: data.investor.liquiditySymbols,
        liquidityTokensAmount: data.investor.liquidityTokensAmount.map((value) => {
          return parseFloat(value)
        }),
        liquidityTokensVolumeETH: data.investor.liquidityTokensVolumeETH.map((value) => {
          return parseFloat(value)
        }),
        liquidityTokensVolumeUSD: data.investor.liquidityTokensVolumeUSD.map((value) => {
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
