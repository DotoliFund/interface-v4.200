import { createAction } from '@reduxjs/toolkit'


export const selectCurrency = createAction<{ currency: string }>('deposit/selectCurrency')
export const typeInput = createAction<{ typedValue: string }>('deposit/typeInput')
export const replaceDepositState = createAction<{
  typedValue: string
  currency: string
  sender: string | null
  fundAccount: string | null
}>('deposit/replaceDepositState')
export const setSender = createAction<{ sender: string | null }>('deposit/setSender')
export const setFundAccount = createAction<{ fundAccount: string | null }>('deposit/setFundAccount')