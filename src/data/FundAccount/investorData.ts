import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Investor, InvestorFields } from 'types/fund'

const INVESTOR_DATA = gql`
  query investor($fund: Bytes!, $investor: Bytes!) {
    investor(where: { fund: $fund, investor: $investor }, subgraphError: allow) {
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
  investor: InvestorFields[]
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
  data: Investor[]
} {
  if (!investor) {
    investor = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<InvestorResponse>(INVESTOR_DATA, {
    variables: { fund, investor },
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

  const formatted: Investor[] = data
    ? data.investor.map((value, index) => {
        const investorDataFields = data.investor[index]
        const investorData: Investor = {
          id: investorDataFields.id,
          createdAtTimestamp: parseFloat(investorDataFields.createdAtTimestamp),
          createdAtBlockNumber: parseFloat(investorDataFields.createdAtBlockNumber),
          fund: investorDataFields.fund,
          manager: investorDataFields.manager,
          investor: investorDataFields.investor,
          principalETH: parseFloat(investorDataFields.principalETH),
          principalUSD: parseFloat(investorDataFields.principalUSD),
          volumeETH: parseFloat(investorDataFields.volumeETH),
          volumeUSD: parseFloat(investorDataFields.volumeUSD),
          profitETH: parseFloat(investorDataFields.profitETH),
          profitUSD: parseFloat(investorDataFields.profitUSD),
          profitRatioETH: parseFloat(investorDataFields.profitRatioETH),
          profitRatioUSD: parseFloat(investorDataFields.profitRatioUSD),
        }
        return investorData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
