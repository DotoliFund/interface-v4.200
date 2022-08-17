import { createReducer } from '@reduxjs/toolkit'
import { parsedQueryString } from 'hooks/useParsedQueryString'
import { replaceCreateState, selectCurrency, typeInput, setSender } from './actions'
import { queryParametersToCreateState } from './hooks'

export interface CreateState {
  readonly typedValue: string;
  readonly currency: string;
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly sender: string | null;
}


const initialState: CreateState = queryParametersToCreateState(parsedQueryString());


export default createReducer<CreateState>(initialState, (builder) =>
  builder
    .addCase(
      replaceCreateState,
      (state, { payload: { typedValue, currency, sender } }) => {
        return {
          typedValue,
          currency,
          sender
        };
      }
    )
    .addCase(selectCurrency, (state, { payload: { currency } }) => {
      state.currency = currency
    })
    .addCase(typeInput, (state, { payload: { typedValue } }) => {
      state.typedValue = typedValue
    })
    .addCase(setSender, (state, { payload: { sender } }) => {
      state.sender = sender
    })
)