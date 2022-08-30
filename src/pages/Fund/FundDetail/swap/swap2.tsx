import { useCallback, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { styled, Container  } from '@mui/system'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import { CustomButton } from 'components/Button'
import CurrencyInputPanel from 'components/createFund/CurrencyInputPanel'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useWeb3React } from '@web3-react/core'
import { useContract, useXXXFactoryContract } from 'hooks/useContract'
import { useCurrency } from 'hooks/Tokens'
import { useParams } from 'react-router-dom'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from 'state/transactions/hooks'
import { computeFundAddress } from 'interface/utils/computeFundAddress'
import { TransactionType } from 'state/transactions/types'
import { sendEvent } from 'components/analytics'
import { useDerivedCreateInfo, useCreateState, useCreateActionHandlers } from 'state/create/hooks'
import { XXXFACTORY_ADDRESSES, XXXFUND_ADDRESSES, XXXToken_ADDRESS, NEWFUND_ADDRESS } from 'constants/addresses'
import { XXXFund } from 'interface/XXXFund'
//import { useToggleWalletModal } from 'state/application/hooks'
import { useTokenContract } from 'hooks/useContract'
import { MaxUint256 } from '@ethersproject/constants'
import { useSwapCallback } from 'hooks/useSwapCallback'
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState,
} from 'state/swap/hooks'
import { InterfaceTrade } from 'state/routing/types'
import { TradeState } from 'state/routing/types'
import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Field } from 'state/swap/actions'
import useWrapCallback, { WrapErrorText, WrapType } from 'hooks/useWrapCallback'
import useAutoSlippageTolerance from 'hooks/useAutoSlippageTolerance'
import { useBestTrade } from 'hooks/useBestTrade'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'


export default function FundSwap() {

  const name0 = 'Wrapped Ether'
  const symbol0 = 'WETH'
  const decimals0 = 18
  const address0 = '0xc778417e063141139fce010982780140aa0cd5ab'
  
  const name1 = 'Uniswap Token'
  const symbol1 = 'UNI'
  const decimals1 = 18
  const address1 = '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984'

  const { account, chainId, provider } = useWeb3React()

  let inputCurrency = useCurrency(address0)
  let outputCurrency = useCurrency(address1)

  if(!inputCurrency) {
    inputCurrency = undefined
  }
  if(!outputCurrency) {
    outputCurrency = undefined
  }
  const typedValue = '1'

  const parsedAmount = tryParseCurrencyAmount(typedValue, inputCurrency)

  const trade = useBestTrade(
    TradeType.EXACT_INPUT,
    parsedAmount,
    outputCurrency
  )
  // allowed slippage is either auto slippage, or custom user defined slippage if auto slippage disabled
  const autoSlippageTolerance = useAutoSlippageTolerance(trade.trade)
  const allowedSlippage = useUserSlippageToleranceWithDefault(autoSlippageTolerance)

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade.trade,
    allowedSlippage,
    '0xAC8fa658D92eB97D92c145774d103f4D9578da16'
  )

  function handleSwap() {

    if(!account) {
      console.log('account is null')
      return
    }


    if (!swapCallback) {
      return
    }
    // if (stablecoinPriceImpact && !confirmPriceImpactWithoutFee(stablecoinPriceImpact)) {
    //   return
    // }
    //setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
    swapCallback()
      .then((hash) => {
        console.log(hash);
        //setSwapState({ attemptingTxn: false, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: hash })
        // sendEvent({
        //   category: 'Swap',
        //   action: 'transaction hash',
        //   label: hash,
        // })
        // sendEvent({
        //   category: 'Swap',
        //   action:
        //     recipient === null
        //       ? 'Swap w/o Send'
        //       : (recipientAddress ?? recipient) === account
        //       ? 'Swap w/o Send + recipient'
        //       : 'Swap w/ Send',
        //   label: [TRADE_STRING, trade?.inputAmount?.currency?.symbol, trade?.outputAmount?.currency?.symbol, 'MH'].join(
        //     '/'
        //   ),
        // })
      })
      .catch((error) => {
        // setSwapState({
        //   attemptingTxn: false,
        //   tradeToConfirm,
        //   showConfirm,
        //   swapErrorMessage: error.message,
        //   txHash: undefined,
        // })
      })
  }

  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justifyContent="center"
    >
      <Grid item xs={3}>
        <Box
          sx={{
            width: 500,
            height: 260,
            mt: 12,
            px:1,
            backgroundColor: 'success.main',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >

          <Typography variant="button" display="block" gutterBottom sx={{ mt: 2 }}>
            Swap
          </Typography>

          <CustomButton onClick={() => handleSwap()}>Swap</CustomButton>
        </Box>
      </Grid>   
    </Grid> 

  );
}