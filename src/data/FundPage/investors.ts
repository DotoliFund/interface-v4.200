import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Investor } from 'types/fund'

const INVESTORS = gql`
  query investors($fundId: String!) {
    investors(
      first: 100
      orderBy: principalUSD
      orderDirection: desc
      where: { isManager: false, fundId: $fundId }
      subgraphError: allow
    ) {
      id
      createdAtTimestamp
      updatedAtTimestamp
      fundId
      investor
      isManager
      principalUSD
      currentUSD
      profitRatio
    }
  }
`

interface InvestorFields {
  id: string
  createdAtTimestamp: string
  updatedAtTimestamp: string
  fundId: string
  investor: string
  isManager: string
  principalUSD: string
  currentUSD: string
  profitRatio: string
}

interface InvestorResponse {
  investors: InvestorFields[]
}

/**
 * Fetch Investor list data
 */
export function useInvestors(fundId: string | undefined): {
  loading: boolean
  error: boolean
  data: Investor[] | undefined
} {
  if (fundId === undefined) {
    fundId = '0'
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<InvestorResponse>(INVESTORS, {
    variables: { fundId },
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

  const investors: Investor[] = data
    ? data.investors.map((investor) => {
        const investorData: Investor = {
          id: investor.id,
          createdAtTimestamp: parseInt(investor.createdAtTimestamp),
          updatedAtTimestamp: parseInt(investor.updatedAtTimestamp),
          fundId: investor.fundId,
          investor: investor.investor,
          isManager: Boolean(investor.isManager),
          principalUSD: parseFloat(investor.principalUSD),
          currentUSD: parseFloat(investor.currentUSD),
          profitRatio: parseFloat(investor.profitRatio),
        }
        return investorData
      })
    : []

  return { data: [...investors], error: false, loading: false }
}
