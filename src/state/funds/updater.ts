import { useTopFunds } from 'data/menu/Overview/topFunds'
import { useEffect } from 'react'

import { useUpdateFundData } from './hooks'

export default function Updater(): null {
  // updaters
  const updateFundData = useUpdateFundData()

  // update unloaded pool entries with fetched data
  const { error: fundDataError, loading: fundDataLoading, data: fundDatas } = useTopFunds()

  useEffect(() => {
    if (fundDatas && !fundDataError && !fundDataLoading) {
      updateFundData(Object.values(fundDatas))
    }
  }, [fundDataError, fundDataLoading, fundDatas, updateFundData])

  return null
}
