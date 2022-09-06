import { createAction } from '@reduxjs/toolkit'

export enum Field {
  INPUT = 'INPUT',
}

export const selectCurrency = createAction<{ currencyId: string }>('deposit/selectCurrency')
export const typeInput = createAction<{ typedValue: string }>('deposit/typeInput')
export const replaceDepositState = createAction<{
  typedValue: string
  inputCurrencyId?: string
  recipient: string | null
}>('deposit/replaceDepositState')
export const setRecipient = createAction<{ recipient: string | null }>('deposit/setRecipient')
