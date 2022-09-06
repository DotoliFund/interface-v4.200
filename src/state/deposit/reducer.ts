import { createReducer } from '@reduxjs/toolkit'
import { parsedQueryString } from 'hooks/useParsedQueryString'

import { Field, replaceDepositState, selectCurrency, setRecipient, typeInput } from './actions'
import { queryParametersToSwapState } from './hooks'

export interface DepositState {
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined | null
  }
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
}

const initialState: DepositState = queryParametersToSwapState(parsedQueryString())

export default createReducer<DepositState>(initialState, (builder) =>
  builder
    .addCase(replaceDepositState, (state, { payload: { typedValue, recipient, inputCurrencyId } }) => {
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
