import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Manager } from 'types/fund'

const MANAGER_DATA = gql`
  query managerData($fund: Bytes!) {
    investors(first: 1, where: { isManager: true, fund: $fund }, subgraphError: allow) {
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

export interface ManagerFields {
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

interface ManagerResponse {
  investors: ManagerFields[]
}

/**
 * Fetch manager data
 */
export function useManagerData(fund: string | undefined): {
  loading: boolean
  error: boolean
  data: Manager | undefined
} {
  if (!fund) {
    fund = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<ManagerResponse>(MANAGER_DATA, {
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

  const formatted: Manager[] | undefined = data
    ? data.investors.map((data2, index) => {
        const fundData: Manager = {
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
        return fundData
      })
    : undefined

  return { data: formatted && formatted.length > 0 ? formatted[0] : undefined, error: false, loading: false }
}
