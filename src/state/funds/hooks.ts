import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { notEmpty } from 'utils'

import { AppDispatch, AppState } from './../index'
import { updateFundData } from './actions'
import { FundData } from './reducer'

export function useAllFundData(): {
  [address: string]: { data: FundData | undefined; lastUpdated: number | undefined }
} {
  const [network] = useActiveNetworkVersion()
  return useSelector((state: AppState) => state.funds.byAddress[network.id] ?? {})
}

export function useUpdateFundData(): (funds: FundData[]) => void {
  const dispatch = useDispatch<AppDispatch>()
  const [network] = useActiveNetworkVersion()
  return useCallback(
    (funds: FundData[]) => dispatch(updateFundData({ funds, networkId: network.id })),
    [dispatch, network.id]
  )
}

export function useFundDatas(fundAddresses: string[]): FundData[] {
  const allFundData = useAllFundData()

  const untrackedAddresses = fundAddresses.reduce((accum: string[], address) => {
    if (!Object.keys(allFundData).includes(address)) {
      accum.push(address)
    }
    return accum
  }, [])

  // filter for funds with data
  const fundsWithData = fundAddresses
    .map((address) => {
      const fundData = allFundData[address]?.data
      return fundData ?? undefined
    })
    .filter(notEmpty)

  return fundsWithData
}
