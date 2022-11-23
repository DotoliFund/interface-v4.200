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
      principalUSD
      volumeETH
      volumeUSD
      tokens
      symbols
      tokensVolumeUSD
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
        principalUSD: parseFloat(data.investor.principalUSD),
        volumeETH: parseFloat(data.investor.volumeETH),
        volumeUSD: parseFloat(data.investor.volumeUSD),
        tokens: data.investor.tokens,
        symbols: data.investor.symbols,
        tokensVolumeUSD: data.investor.tokensVolumeUSD.map((value) => {
          return parseFloat(value)
        }),
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
