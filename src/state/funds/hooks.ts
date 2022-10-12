import { useTopFunds } from 'data/menu/Overview/topFunds'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { Fund } from 'types/fund'

import { AppDispatch } from './../index'
import { updateFundData } from './actions'

export function useUpdateFundData(): (funds: Fund[]) => void {
  const dispatch = useDispatch<AppDispatch>()
  const [network] = useActiveNetworkVersion()
  return useCallback(
    (funds: Fund[]) => dispatch(updateFundData({ funds, networkId: network.id })),
    [dispatch, network.id]
  )
}

export function useFundListData(): {
  loading: boolean
  error: boolean
  data: Fund[]
} {
  return useTopFunds()
}
