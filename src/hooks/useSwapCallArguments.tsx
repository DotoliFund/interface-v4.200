//import { BigNumber } from '@ethersproject/bignumber'
//import { SwapRouter, Trade } from '@uniswap/router-sdk'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
//import { SWAP_ROUTER_ADDRESSES } from 'constants/addresses'
import { DotoliFund } from 'interface/DotoliFund'
import { useMemo } from 'react'
//import useENS from './useENS'

interface SwapCall {
  address: string
  calldata: string
  value: string
}

export function useSwapCallArguments(
  fundAddress: string | undefined,
  investorAddress: string | undefined,
  trade: Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent
): SwapCall[] {
  const { account, chainId, provider } = useWeb3React()

  return useMemo(() => {
    if (!fundAddress || !investorAddress || !trade || !provider || !account || !chainId) return []

    const { value, calldata } = DotoliFund.swapCallParameters(fundAddress, investorAddress, trade, {
      slippageTolerance: allowedSlippage,
    })

    return [
      {
        address: fundAddress,
        calldata,
        value,
      },
    ]
  }, [fundAddress, investorAddress, account, allowedSlippage, chainId, provider, trade])
}
