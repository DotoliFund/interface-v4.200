//import { BigNumber } from '@ethersproject/bignumber'
//import { SwapRouter, Trade } from '@uniswap/router-sdk'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { NEWFUND_ADDRESS } from 'constants/addresses'
//import { SWAP_ROUTER_ADDRESSES } from 'constants/addresses'
import { XXXFund } from 'interface/XXXFund'
import { useMemo } from 'react'
//import useENS from './useENS'

interface SwapCall {
  address: string
  calldata: string
  value: string
}

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 */
export function useSwapCallArguments(
  trade: Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent
): SwapCall[] {
  const { account, chainId, provider } = useWeb3React()

  return useMemo(() => {
    if (!trade || !provider || !account || !chainId) return []

    //const swapRouterAddress = chainId ? SWAP_ROUTER_ADDRESSES[chainId] : undefined
    const swapRouterAddress = '0x39f90436eBD4A08f5Fa7674257b198632599E5F5'

    if (!swapRouterAddress) return []

    const { value, calldata } = XXXFund.swapCallParameters(account, trade, {
      slippageTolerance: allowedSlippage,
    })

    return [
      {
        address: NEWFUND_ADDRESS,
        calldata,
        value,
      },
    ]
  }, [account, allowedSlippage, chainId, provider, trade])
}
