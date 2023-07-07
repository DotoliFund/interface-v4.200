import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { TopManager } from 'types/fund'

const TOP_MANAGERS_BULK = () => {
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
        fundId
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

interface TopManagerFields {
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
  const last6Month = new Date(now.setMonth(now.getMonth() - 3))
  const updated = Math.floor(last6Month.getTime() / 1000)

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
    ? data.investors.map((investor) => {
        const investorData: TopManager = {
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

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
