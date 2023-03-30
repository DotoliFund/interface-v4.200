import { useQuery } from '@apollo/client'
import { DOTOLI_INFO_ADDRESSES } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

const INFO_DATA = gql`
  query info($infoAddress: Bytes!) {
    info(id: $infoAddress, subgraphError: allow) {
      id
      fundCount
      investorCount
      managerFee
      minPoolAmount
    }
  }
`

interface Info {
  id: string
  fundCount: number
  investorCount: number
  managerFee: number
  minPoolAmount: number
}

interface InfoFields {
  id: string
  fundCount: string
  investorCount: string
  managerFee: string
  minPoolAmount: string
}

interface InfoResponse {
  info: InfoFields
}

/**
 * Fetch DotoliInfo data
 */
export function useInfoData(): {
  loading: boolean
  error: boolean
  data: Info | undefined
} {
  // get client
  const { dataClient } = useClients()
  const infoAddress = DOTOLI_INFO_ADDRESSES

  const { loading, error, data } = useQuery<InfoResponse>(INFO_DATA, {
    variables: { infoAddress },
    client: dataClient,
  })

  if (!data || (data && !data.info)) return { data: undefined, error: false, loading: false }
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

  const formatted: Info | undefined = data
    ? {
        id: data.info.id,
        fundCount: parseInt(data.info.fundCount),
        investorCount: parseInt(data.info.investorCount),
        managerFee: parseInt(data.info.managerFee),
        minPoolAmount: parseInt(data.info.minPoolAmount),
      }
    : undefined

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
