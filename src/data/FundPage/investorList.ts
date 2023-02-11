import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { InvestorList } from 'types/fund'

const INVESTOR_LIST = gql`
  query investors($fund: Bytes!) {
    investors(
      first: 100
      orderBy: principalUSD
      orderDirection: desc
      where: { isManager: false, fund: $fund }
      subgraphError: allow
    ) {
      id
      createdAtTimestamp
      updatedAtTimestamp
      fund
      investor
      isManager
      principalUSD
      currentUSD
      profitRatio
    }
  }
`

export interface InvestorListFields {
  id: string
  createdAtTimestamp: string
  updatedAtTimestamp: string
  fund: string
  investor: string
  isManager: string
  principalUSD: string
  currentUSD: string
  profitRatio: string
}

interface InvestorListResponse {
  investors: InvestorListFields[]
}

/**
 * Fetch Investor list data
 */
export function useInvestorList(fund: string | undefined): {
  loading: boolean
  error: boolean
  data: InvestorList[] | undefined
} {
  if (!fund) {
    fund = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<InvestorListResponse>(INVESTOR_LIST, {
    variables: { fund },
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

  const investors: InvestorList[] = data
    ? data.investors.map((data2, index) => {
        const investorData: InvestorList = {
          id: data2.id,
          createdAtTimestamp: parseFloat(data2.createdAtTimestamp),
          updatedAtTimestamp: parseFloat(data2.updatedAtTimestamp),
          fund: data2.fund,
          investor: data2.investor,
          isManager: Boolean(data2.isManager),
          principalUSD: parseFloat(data2.principalUSD),
          currentUSD: parseFloat(data2.currentUSD),
          profitRatio: parseFloat(data2.profitRatio),
        }
        return investorData
      })
    : []

  return { data: [...investors], error: false, loading: false }
}
