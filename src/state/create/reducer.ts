import { createReducer } from '@reduxjs/toolkit'
import { parsedQueryString } from 'hooks/useParsedQueryString'

import { replaceCreateState, selectCurrency, setSender, typeInput } from './actions'
import { queryParametersToCreateState } from './hooks'

export interface CreateState {
  readonly inputCurrencyId: string
  readonly typedValue: string
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly sender: string | null
}

const initialState: CreateState = queryParametersToCreateState(parsedQueryString())

export default createReducer<CreateState>(initialState, (builder) =>
  builder
    .addCase(replaceCreateState, (state, { payload: { typedValue, inputCurrencyId, sender } }) => {
      return {
        typedValue,
        inputCurrencyId,
        sender,
      }
    })
    .addCase(selectCurrency, (state, { payload: { inputCurrencyId } }) => {
      state.inputCurrencyId = inputCurrencyId
    })
    .addCase(typeInput, (state, { payload: { typedValue } }) => {
      state.typedValue = typedValue
    })
    .addCase(setSender, (state, { payload: { sender } }) => {
      state.sender = sender
    })
)
