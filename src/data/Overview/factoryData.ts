import { useQuery } from '@apollo/client'
import { DOTOLI_FACTORY_ADDRESSES } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Factory, FactoryFields } from 'types/fund'

const FACTORY_DATA_BULK = gql`
  query factory($factory: Bytes!) {
    factory(id: $factory, subgraphError: allow) {
      id
      fundCount
      investorCount
      managerFee
      minPoolAmount
    }
  }
`

interface FactoryResponse {
  factory: FactoryFields
}

/**
 * Fetch dotoli factory data
 */
export function useFactoryData(): {
  loading: boolean
  error: boolean
  data: Factory | undefined
} {
  // get client
  const { dataClient } = useClients()
  const factory = DOTOLI_FACTORY_ADDRESSES

  const { loading, error, data } = useQuery<FactoryResponse>(FACTORY_DATA_BULK, {
    variables: { factory },
    client: dataClient,
  })

  if (!data || (data && !data.factory)) return { data: undefined, error: false, loading: false }
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

  const formatted: Factory | undefined = data
    ? {
        id: data.factory.id,
        fundCount: parseInt(data.factory.fundCount),
        investorCount: parseInt(data.factory.investorCount),
        managerFee: parseInt(data.factory.managerFee),
        minPoolAmount: parseInt(data.factory.minPoolAmount),
      }
    : undefined

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
