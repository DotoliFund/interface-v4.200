import { BigNumber } from '@ethersproject/bignumber'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { FeeOptions, SwapRouter as V3SwapRouter, Trade as V3Trade } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { V3_ROUTER_ADDRESS } from 'constants/addresses'
import { useMemo } from 'react'

//import { useArgentWalletContract } from './useArgentWalletContract'
import useENS from './useENS'
import { SignatureData } from './useERC20Permit'

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
 * @param signatureData the signature data of the permit of the input token amount, if available
 */
export function useSwapCallArguments(
  trade: Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent,
  recipientAddressOrName: string | null | undefined,
  signatureData: SignatureData | null | undefined,
  deadline: BigNumber | undefined,
  feeOptions: FeeOptions | undefined
): SwapCall[] {
  const { account, chainId, provider } = useWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  //const argentWalletContract = useArgentWalletContract()
  const argentWalletContract = undefined

  return useMemo(() => {
    if (!trade || !recipient || !provider || !account || !chainId || !deadline) return []

    if (trade instanceof V2Trade) {
      console.log('Error : useSwapCallArguments() => trade instance is V2Trade')
      return []
    } else {
      // swap options shared by v3 and v2+v3 swap routers
      const sharedSwapOptions = {
        fee: feeOptions,
        recipient,
        slippageTolerance: allowedSlippage,
        ...(signatureData
          ? {
              inputTokenPermit:
                'allowed' in signatureData
                  ? {
                      expiry: signatureData.deadline,
                      nonce: signatureData.nonce,
                      s: signatureData.s,
                      r: signatureData.r,
                      v: signatureData.v as any,
                    }
                  : {
                      deadline: signatureData.deadline,
                      amount: signatureData.amount,
                      s: signatureData.s,
                      r: signatureData.r,
                      v: signatureData.v as any,
                    },
            }
          : {}),
      }

      const swapRouterAddress = chainId
        ? trade instanceof V3Trade
          ? V3_ROUTER_ADDRESS[chainId]
          : undefined
        : undefined
      if (!swapRouterAddress) return []

      const { value, calldata } =
        trade instanceof V3Trade
          ? V3SwapRouter.swapCallParameters(trade, {
              ...sharedSwapOptions,
              deadline: deadline.toString(),
            })
          : { value: '', calldata: undefined }

      if (!value || !calldata) {
        console.log('Error : useSwapCallArguments() => trade instance is not V3Trade')
        return []
      }

      // if (argentWalletContract && trade.inputAmount.currency.isToken) {
      //   return [
      //     {
      //       address: argentWalletContract.address,
      //       calldata: argentWalletContract.interface.encodeFunctionData('wc_multiCall', [
      //         [
      //           approveAmountCalldata(trade.maximumAmountIn(allowedSlippage), swapRouterAddress),
      //           {
      //             to: swapRouterAddress,
      //             value,
      //             data: calldata,
      //           },
      //         ],
      //       ]),
      //       value: '0x0',
      //     },
      //   ]
      // }
      return [
        {
          address: swapRouterAddress,
          calldata,
          value,
        },
      ]
    }
  }, [
    account,
    allowedSlippage,
    argentWalletContract,
    chainId,
    deadline,
    feeOptions,
    provider,
    recipient,
    signatureData,
    trade,
  ])
}
