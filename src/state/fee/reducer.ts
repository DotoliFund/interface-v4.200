import { createReducer } from '@reduxjs/toolkit'
import { parsedQueryString } from 'hooks/useParsedQueryString'

import { Field, replaceFeeState, selectCurrency, setRecipient, typeInput } from './actions'
import { queryParametersToFeeState } from './hooks'

export interface FeeState {
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined | null
  }
  // the typed recipient address or ENS name, or null if fee should go to sender
  readonly recipient: string | null
}

const initialState: FeeState = queryParametersToFeeState(parsedQueryString())

export default createReducer<FeeState>(initialState, (builder) =>
  builder
    .addCase(replaceFeeState, (state, { payload: { typedValue, recipient, inputCurrencyId } }) => {
      return {
        [Field.INPUT]: {
          currencyId: inputCurrencyId ?? null,
        },
        typedValue,
        recipient,
      }
    })
    .addCase(selectCurrency, (state, { payload: { currencyId } }) => {
      return {
        ...state,
        [Field.INPUT]: { currencyId },
      }
    })
    .addCase(typeInput, (state, { payload: { typedValue } }) => {
      return {
        ...state,
        typedValue,
      }
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
)
