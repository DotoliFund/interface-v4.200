import { BigNumber } from '@ethersproject/bignumber'
import { SwapRouter, Trade } from '@uniswap/router-sdk'
//import { Trade } from '@uniswap/router-sdk'
//import { XXXFund } from 'interface/XXXFund'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { SWAP_ROUTER_ADDRESSES } from 'constants/addresses'
import { useMemo } from 'react'

import useENS from './useENS'

interface SwapCall {
  address: string
  calldata: string
  value: string
}

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName the ENS name or address of the recipient of the swap output
 */
export function useSwapCallArguments(
  trade: Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent,
  recipientAddressOrName: string | null | undefined,
  deadline: BigNumber | undefined
): SwapCall[] {
  const { account, chainId, provider } = useWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  return useMemo(() => {
    if (!trade || !recipient || !provider || !account || !chainId || !deadline) return []

    const swapRouterAddress = chainId ? SWAP_ROUTER_ADDRESSES[chainId] : undefined
    //const swapRouterAddress = '0x39f90436eBD4A08f5Fa7674257b198632599E5F5'

    if (!swapRouterAddress) return []

    const { value, calldata } = SwapRouter.swapCallParameters(trade, {
      recipient,
      slippageTolerance: allowedSlippage,
      deadlineOrPreviousBlockhash: deadline.toString(),
    })

    return [
      {
        address: swapRouterAddress,
        calldata,
        value,
      },
    ]
  }, [account, allowedSlippage, chainId, deadline, provider, recipient, trade])
}
