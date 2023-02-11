import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { TopManager } from 'types/fund'

export const TOP_MANAGERS_BULK = () => {
  const queryString = `
    query topManagers($updated: BigInt!) {
      investors(
        first: 100,
        orderBy: profitRatio,
        orderDirection: desc,
        where: { 
          isManager: true,
          updatedAtTimestamp_gt: $updated
        },
        subgraphError: allow)
      {
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
  return gql(queryString)
}

export interface TopManagerFields {
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

interface TopManagerResponse {
  investors: TopManagerFields[]
}

/**
 * Fetch top managers by profitRatio
 */
export function useTopManagers(): {
  loading: boolean
  error: boolean
  data: TopManager[]
} {
  // get client
  const { dataClient } = useClients()
  const now = new Date()
  const lastMonth = new Date(now.setMonth(now.getMonth() - 1))
  const updated = Math.floor(lastMonth.getTime() / 1000)

  const { loading, error, data } = useQuery<TopManagerResponse>(TOP_MANAGERS_BULK(), {
    variables: { updated },
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

  const formatted: TopManager[] = data
    ? data.investors.map((data2, index) => {
        const investorData: TopManager = {
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

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
