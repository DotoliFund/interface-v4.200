import { useTopFunds } from 'data/menu/Overview/topFunds'
import { FundData } from 'data/menu/Overview/topFunds'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useActiveNetworkVersion } from 'state/application/hooks'

import { AppDispatch } from './../index'
import { updateFundData } from './actions'

export function useUpdateFundData(): (funds: FundData[]) => void {
  const dispatch = useDispatch<AppDispatch>()
  const [network] = useActiveNetworkVersion()
  return useCallback(
    (funds: FundData[]) => dispatch(updateFundData({ funds, networkId: network.id })),
    [dispatch, network.id]
  )
}

export function useFundListData(): {
  loading: boolean
  error: boolean
  data: FundData[]
} {
  return useTopFunds()
}
