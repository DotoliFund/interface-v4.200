import { useQuery } from '@apollo/client'
import { DOTOLI_SETTING_ADDRESSES } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'

const SETTING_DATA = gql`
  query setting($settingAddress: Bytes!) {
    setting(id: $settingAddress, subgraphError: allow) {
      id
      managerFee
      minPoolAmount
    }
  }
`

interface Setting {
  id: string
  managerFee: number
  minPoolAmount: number
}

interface SettingFields {
  id: string
  managerFee: string
  minPoolAmount: string
}

interface SettingResponse {
  setting: SettingFields
}

/**
 * Fetch DotoliSetting data
 */
export function useSettingData(): {
  loading: boolean
  error: boolean
  data: Setting | undefined
} {
  // get client
  const { dataClient } = useClients()
  const settingAddress = DOTOLI_SETTING_ADDRESSES

  const { loading, error, data } = useQuery<SettingResponse>(SETTING_DATA, {
    variables: { settingAddress },
    client: dataClient,
  })

  if (!data || (data && !data.setting)) return { data: undefined, error: false, loading: false }
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

  const formatted: Setting | undefined = data
    ? {
        id: data.setting.id,
        managerFee: parseInt(data.setting.managerFee),
        minPoolAmount: parseInt(data.setting.minPoolAmount),
      }
    : undefined

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
