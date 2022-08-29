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


export default function FundSwap() {
  const { account, chainId, provider } = useWeb3React()
  const { onCurrencySelection, onUserInput, onChangeSender } = useCreateActionHandlers()
  const factory = useXXXFactoryContract()
  const addTransaction = useTransactionAdder()
  //const toggleWalletModal = useToggleWalletModal()
  const {
    currencyIdA,
    tokenId,
  } = useParams<{ currencyIdA?: string; tokenId?: string }>()
  //const baseCurrency = useCurrency(currencyIdA)

  const handleCurrencySelect = useCallback(
    (currency : string) => {
      onCurrencySelection(currency)
    },
    [onCurrencySelection]
  )

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(value)
    },
    [onUserInput]
  )

  //TODO the graph
  function isExistingFund(account: string): boolean {
    return false
  }

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings

  const inputCurrencyId = 'testtest'

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const {
    trade: { state: tradeState, trade },
    allowedSlippage,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
  } = useDerivedSwapInfo()
  
  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade<Currency, Currency, TradeType> | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  function useApprovalOptimizedTrade(
    trade: Trade<Currency, Currency, TradeType> | undefined
  ) {
    return 1
  }

  useApprovalOptimizedTrade(trade)

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade,
    allowedSlippage,
    recipient
  )


  const new_fund_address = NEWFUND_ADDRESS
  const token_address = XXXToken_ADDRESS

  // // check whether the user has approved the router on the tokens
  // const [approval, approveCallback] = useApproveCallback(parsedAmount, new_fund_address)
  // // we need an existence check on parsed amounts for single-asset deposits
  // const showApproval =
  //   approval !== ApprovalState.APPROVED && !!parsedAmount

  const tokenContract = useTokenContract(token_address)

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    // if (stablecoinPriceImpact && !confirmPriceImpactWithoutFee(stablecoinPriceImpact)) {
    //   return
    // }
    setSwapState({ attemptingTxn: true, tradeToConfirm, showConfirm, swapErrorMessage: undefined, txHash: undefined })
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
  }, [
    swapCallback,
    //stablecoinPriceImpact,
    //tradeToConfirm,
    //showConfirm,
    //recipient,
    //recipientAddress,
    //account,
    //trade?.inputAmount?.currency?.symbol,
    //trade?.outputAmount?.currency?.symbol,
  ])

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
          <CurrencyInputPanel 
            value={typedValue}
            onUserInput={handleTypeInput}
            onCurrencySelect={handleCurrencySelect}
            currency={inputCurrencyId}
          />
          <CustomButton onClick={() => handleSwap()}>Deposit</CustomButton>
        </Box>
      </Grid>   
    </Grid> 

  );
}