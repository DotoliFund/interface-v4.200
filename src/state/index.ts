import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import deposit from 'state/deposit/reducer'
import create from 'state/create/reducer'
import user from 'state/user/reducer'
import connection from 'state/connection/reducer'
import transactions from 'state/transactions/reducer'
import { updateVersion } from './global/actions'
import lists from './lists/reducer'
import multicall from 'lib/state/multicall'
import swap from 'state/swap/reducer'
import { routingApi } from './routing/slice'
import { load, save } from 'redux-localstorage-simple'
import { isTestEnv } from 'utils/env'

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'lists']

export const store = configureStore({
  reducer: {
  	deposit,
	create,
  	user,
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