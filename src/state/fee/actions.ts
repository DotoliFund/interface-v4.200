import { createAction } from '@reduxjs/toolkit'

export enum Field {
  INPUT = 'INPUT',
}

export const selectCurrency = createAction<{ currencyId: string }>('fee/selectCurrency')
export const typeInput = createAction<{ typedValue: string }>('fee/typeInput')
export const replaceFeeState = createAction<{
  typedValue: string
  inputCurrencyId?: string
  recipient: string | null
}>('fee/replaceFeeState')
export const setRecipient = createAction<{ recipient: string | null }>('fee/setRecipient')
