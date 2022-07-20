import { configureStore } from '@reduxjs/toolkit'
import deposit from 'state/deposit/reducer'
import user from 'state/user/reducer'

export const store = configureStore({
  reducer: {
  	deposit,
  	user
  },
})
export default store



// Infer the `AppState` and `AppDispatch` types from the store itself
export type AppState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch