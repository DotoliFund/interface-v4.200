import { createAction } from '@reduxjs/toolkit'

export enum Field {
  INPUT = 'INPUT',
}

export const selectCurrency = createAction<{ currencyId: string }>('withdraw/selectCurrency')
export const typeInput = createAction<{ typedValue: string }>('withdraw/typeInput')
export const replaceWithdrawState = createAction<{
  typedValue: string
  inputCurrencyId?: string
  recipient: string | null
}>('withdraw/replaceWithdrawState')
export const setRecipient = createAction<{ recipient: string | null }>('withdraw/setRecipient')
