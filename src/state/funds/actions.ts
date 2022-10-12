import { createAction } from '@reduxjs/toolkit'
import { SupportedNetwork } from 'constants/networks'
import { Fund } from 'types/fund'

// protocol wide info
export const updateFundData = createAction<{ funds: Fund[]; networkId: SupportedNetwork }>('funds/updateFundData')
