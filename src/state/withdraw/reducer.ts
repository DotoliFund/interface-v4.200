import { createReducer } from '@reduxjs/toolkit'
import { parsedQueryString } from 'hooks/useParsedQueryString'

import { Field, replaceWithdrawState, selectCurrency, setRecipient, typeInput } from './actions'
import { queryParametersToWithdrawState } from './hooks'

export interface WithdrawState {
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined | null
  }
  // the typed recipient address or ENS name, or null if withdraw should go to sender
  readonly recipient: string | null
}

const initialState: WithdrawState = queryParametersToWithdrawState(parsedQueryString())

export default createReducer<WithdrawState>(initialState, (builder) =>
  builder
    .addCase(replaceWithdrawState, (state, { payload: { typedValue, recipient, inputCurrencyId } }) => {
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
