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
      createdAtBlockNumber
      fund
      manager
      investor
      principalETH
      principalUSD
      volumeETH
      volumeUSD
      profitETH
      profitUSD
      profitRatioETH
      profitRatioUSD
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
        createdAtBlockNumber: parseFloat(data.investor.createdAtBlockNumber),
        fund: data.investor.fund,
        manager: data.investor.manager,
        investor: data.investor.investor,
        principalETH: parseFloat(data.investor.principalETH),
        principalUSD: parseFloat(data.investor.principalUSD),
        volumeETH: parseFloat(data.investor.volumeETH),
        volumeUSD: parseFloat(data.investor.volumeUSD),
        profitETH: parseFloat(data.investor.profitETH),
        profitUSD: parseFloat(data.investor.profitUSD),
        profitRatioETH: parseFloat(data.investor.profitRatioETH),
        profitRatioUSD: parseFloat(data.investor.profitRatioUSD),
      }
    : undefined

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
