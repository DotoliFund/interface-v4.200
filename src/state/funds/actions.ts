import { createAction } from '@reduxjs/toolkit'
import { SupportedNetwork } from 'constants/networks'
import { FundData } from 'data/menu/Overview/topFunds'

// protocol wide info
export const updateFundData = createAction<{ funds: FundData[]; networkId: SupportedNetwork }>('funds/updateFundData')
