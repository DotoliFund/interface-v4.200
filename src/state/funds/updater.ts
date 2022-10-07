import { useFundDatas } from 'data/funds/fundData'
import { useEffect } from 'react'

import { useUpdateFundData } from './hooks'

export default function Updater(): null {
  // updaters
  const updateFundData = useUpdateFundData()

  // update unloaded pool entries with fetched data
  const { error: fundDataError, loading: fundDataLoading, data: fundDatas } = useFundDatas()

  useEffect(() => {
    if (fundDatas && !fundDataError && !fundDataLoading) {
      updateFundData(Object.values(fundDatas))
    }
  }, [fundDataError, fundDataLoading, fundDatas, updateFundData])

  return null
}
