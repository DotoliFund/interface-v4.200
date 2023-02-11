import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { TopFund } from 'types/fund'

export const TOP_FUNDS = () => {
  const queryString = `
    query topFunds {
      funds(orderBy: currentUSD, orderDirection: desc, subgraphError: allow) {
        id
        address
        createdAtTimestamp
        manager
        investorCount
        currentUSD
      }
    }
  `
  return gql(queryString)
}

export interface TopFundFields {
  id: string
  address: string
  createdAtTimestamp: string
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
    ? data.funds.map((data2, index) => {
        const fundData: TopFund = {
          id: data2.id,
          address: data2.address,
          createdAtTimestamp: parseFloat(data2.createdAtTimestamp),
          manager: data2.manager,
          investorCount: parseInt(data2.investorCount),
          currentUSD: parseFloat(data2.currentUSD),
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
