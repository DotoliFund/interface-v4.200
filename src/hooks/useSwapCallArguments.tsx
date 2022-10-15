//import { BigNumber } from '@ethersproject/bignumber'
//import { SwapRouter, Trade } from '@uniswap/router-sdk'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
//import { SWAP_ROUTER_ADDRESSES } from 'constants/addresses'
import { XXXFund2 } from 'interface/XXXFund2'
import { useMemo } from 'react'
//import useENS from './useENS'

interface SwapCall {
  address: string
  calldata: string
  value: string
}

export function useSwapCallArguments(
  fundAddress: string | undefined,
  trade: Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent
): SwapCall[] {
  const { account, chainId, provider } = useWeb3React()

  return useMemo(() => {
    if (!fundAddress || !trade || !provider || !account || !chainId) return []

    //const swapRouterAddress = chainId ? SWAP_ROUTER_ADDRESSES[chainId] : undefined
    const swapRouterAddress = '0x39f90436eBD4A08f5Fa7674257b198632599E5F5'

    if (!swapRouterAddress) return []

    const { value, calldata } = XXXFund2.swapCallParameters(fundAddress, account, trade, {
      slippageTolerance: allowedSlippage,
    })

    return [
      {
        address: fundAddress,
        calldata,
        value,
      },
    ]
  }, [fundAddress, account, allowedSlippage, chainId, provider, trade])
}
