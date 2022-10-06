import { useFundDatas } from 'data/funds/fundData'
import { useEffect, useMemo } from 'react'

import { useAllFundData, useUpdateFundData } from './hooks'

export default function Updater(): null {
  // updaters
  const updateFundData = useUpdateFundData()

  // data
  const allFundData = useAllFundData()

  // detect for which addresses we havent loaded pool data yet
  const unfetchedFundAddresses = useMemo(() => {
    return Object.keys(allFundData).reduce((accum: string[], key) => {
      const fundData = allFundData[key]
      if (!fundData.data || !fundData.lastUpdated) {
        accum.push(key)
      }
      return accum
    }, [])
  }, [allFundData])

  // update unloaded pool entries with fetched data
  const { error: fundDataError, loading: fundDataLoading, data: fundDatas } = useFundDatas(unfetchedFundAddresses)

  useEffect(() => {
    if (fundDatas && !fundDataError && !fundDataLoading) {
      updateFundData(Object.values(fundDatas))
    }
  }, [fundDataError, fundDataLoading, fundDatas, updateFundData])

  return null
}
