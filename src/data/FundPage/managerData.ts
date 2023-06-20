import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Manager } from 'types/fund'

const MANAGER_DATA = gql`
  query managerData($fundId: String!) {
    investors(first: 1, where: { isManager: true, fundId: $fundId }, subgraphError: allow) {
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

interface ManagerFields {
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

interface ManagerResponse {
  investors: ManagerFields[]
}

/**
 * Fetch manager data
 */
export function useManagerData(fundId: string | undefined): {
  loading: boolean
  error: boolean
  data: Manager | undefined
} {
  if (fundId === undefined) {
    fundId = '0'
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<ManagerResponse>(MANAGER_DATA, {
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

  const formatted: Manager[] | undefined = data
    ? data.investors.map((investor) => {
        const fundData: Manager = {
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
        return fundData
      })
    : undefined

  return { data: formatted && formatted.length > 0 ? formatted[0] : undefined, error: false, loading: false }
}
