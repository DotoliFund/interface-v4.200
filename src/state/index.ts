import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import multicall from 'lib/state/multicall'
import { load, save } from 'redux-localstorage-simple'
import connection from 'state/connection/reducer'
import create from 'state/create/reducer'
import deposit from 'state/deposit/reducer'
import fee from 'state/fee/reducer'
import swap from 'state/swap/reducer'
import transactions from 'state/transactions/reducer'
import user from 'state/user/reducer'
import withdraw from 'state/withdraw/reducer'
import { isTestEnv } from 'utils/env'

import application from './application/reducer'
import burnV3 from './burn/v3/reducer'
import funds from './funds/reducer'
import { updateVersion } from './global/actions'
import lists from './lists/reducer'
import mintV3 from './mint/v3/reducer'
import { routingApi } from './routing/slice'
import wallets from './wallets/reducer'

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'lists']

export const store = configureStore({
  reducer: {
    application,
    deposit,
    withdraw,
    fee,
    wallets,
    create,
    user,
    funds,
    mintV3,
    burnV3,
    connection,
    transactions,
    lists,
    multicall: multicall.reducer,
    swap,
    [routingApi.reducerPath]: routingApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: true })
      .concat(routingApi.middleware)
      .concat(save({ states: PERSISTED_KEYS, debounce: 1000 })),
  preloadedState: load({ states: PERSISTED_KEYS, disableWarnings: isTestEnv() }),
})

store.dispatch(updateVersion())

setupListeners(store.dispatch)

export default store

// Infer the `AppState` and `AppDispatch` types from the store itself
export type AppState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
