import { createAction } from '@reduxjs/toolkit'


export const selectCurrency = createAction<{ currency: string }>('create/selectCurrency')
export const typeInput = createAction<{ typedValue: string }>('create/typeInput')
export const replaceCreateState = createAction<{
  typedValue: string
  currency: string
  sender: string | null
}>('create/replaceCreateState')
export const setSender = createAction<{ sender: string | null }>('create/setSender')