import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { TopFund } from 'types/fund'

const TOP_FUNDS = () => {
  const queryString = `
    query topFunds {
      funds(orderBy: currentUSD, orderDirection: desc, subgraphError: allow) {
        id
        fundId
        createdAtTimestamp
        updatedAtTimestamp
        manager
        investorCount
        currentUSD
      }
    }
  `
  return gql(queryString)
}

interface TopFundFields {
  id: string
  fundId: string
  createdAtTimestamp: string
  updatedAtTimestamp: string
  manager: string
  investorCount: string
  currentUSD: string
}

interface TopFundResponse {
  funds: TopFundFields[]
}

/**
 * Fetch top funds by currentUSD
 */
export function useTopFunds(): {
  loading: boolean
  error: boolean
  data: TopFund[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<TopFundResponse>(TOP_FUNDS(), {
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

  const formatted: TopFund[] = data
    ? data.funds.map((fund) => {
        const fundData: TopFund = {
          id: fund.id,
          fundId: fund.fundId,
          createdAtTimestamp: parseFloat(fund.createdAtTimestamp),
          updatedAtTimestamp: parseFloat(fund.updatedAtTimestamp),
          manager: fund.manager,
          investorCount: parseInt(fund.investorCount),
          currentUSD: parseFloat(fund.currentUSD),
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
