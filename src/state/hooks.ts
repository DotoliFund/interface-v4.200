import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
import type { AppState, AppDispatch } from './index'


// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector