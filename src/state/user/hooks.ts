import { Percent, Token } from '@uniswap/sdk-core'
import { computePairAddress, Pair } from '@uniswap/v2-sdk'
import { useWeb3React } from '@web3-react/core'
import { L2_CHAIN_IDS } from 'constants/chains'
import { L2_DEADLINE_FROM_NOW } from 'constants/misc'
import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { updateUserDeadline } from './reducer'

export function useUserTransactionTTL(): [number, (slippage: number) => void] {
  const { chainId } = useWeb3React()
  const dispatch = useAppDispatch()
  const userDeadline = useAppSelector((state) => state.user.userDeadline)
  const onL2 = Boolean(chainId && L2_CHAIN_IDS.includes(chainId))
  const deadline = onL2 ? L2_DEADLINE_FROM_NOW : userDeadline

  const setUserDeadline = useCallback(
    (userDeadline: number) => {
      dispatch(updateUserDeadline({ userDeadline }))
    },
    [dispatch]
  )

  return [deadline, setUserDeadline]
}