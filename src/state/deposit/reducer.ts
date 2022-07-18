import { createReducer } from '@reduxjs/toolkit'
import { parsedQueryString } from 'hooks/useParsedQueryString'
import { replaceDepositState, selectCurrency, setFundAccount, typeInput, setSender } from './actions'
import { queryParametersToDepositState } from './hooks'

export interface DepositState {
  readonly typedValue: string;
  readonly currency: string;
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly sender: string | null;
  readonly fundAccount: string | null;
}


const initialState: DepositState = queryParametersToDepositState(parsedQueryString());


export default createReducer<DepositState>(initialState, (builder) =>
  builder
    .addCase(
      replaceDepositState,
      (state, { payload: { currency, typedValue, sender, fundAccount } }) => {
        return {
          currency,
          typedValue,
          sender,
          fundAccount
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