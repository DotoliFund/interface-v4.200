import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useWeb3React } from '@web3-react/core'
import { CustomButton } from 'components/Button'
import CurrencyInputPanel from 'components/createFund/CurrencyInputPanel'
import { NEWFUND_ADDRESS, XXXToken_ADDRESS } from 'constants/addresses'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useXXXFactoryContract } from 'hooks/useContract'
//import { useToggleWalletModal } from 'state/application/hooks'
import { useTokenContract } from 'hooks/useContract'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { XXXFund } from 'interface/XXXFund'
import { useCallback } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCreateActionHandlers, useCreateState, useDerivedCreateInfo } from 'state/create/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { calculateGasMargin } from 'utils/calculateGasMargin'

export default function FundDeposit() {
  const { account, chainId, provider } = useWeb3React()
  const { onCurrencySelection, onUserInput, onChangeSender } = useCreateActionHandlers()
  const factory = useXXXFactoryContract()
  const addTransaction = useTransactionAdder()
  //const toggleWalletModal = useToggleWalletModal()
  const { currencyIdA, tokenId } = useParams<{ currencyIdA?: string; tokenId?: string }>()
  //const baseCurrency = useCurrency(currencyIdA)

  const handleCurrencySelect = useCallback(
    (currency: string) => {
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

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings
  const [txHash, setTxHash] = useState<string>('')

  // create state
  const { inputCurrencyId, typedValue, sender } = useCreateState()
  const { currency, currencyBalance, parsedAmount, inputError } = useDerivedCreateInfo()

  const new_fund_address = NEWFUND_ADDRESS

  // check whether the user has approved the router on the tokens
  const [approval, approveCallback] = useApproveCallback(parsedAmount, new_fund_address)
  // we need an existence check on parsed amounts for single-asset deposits
  const showApproval = approval !== ApprovalState.APPROVED && !!parsedAmount

  const tokenContract = useTokenContract(XXXToken_ADDRESS)

  async function onDeposit() {
    if (!chainId || !provider || !account) return
    if (isExistingFund(account) || !parsedAmount) return
    console.log(0)

    if (!tokenContract) return
    let useExact = false
    const estimatedGas = await tokenContract.estimateGas.approve(new_fund_address, MaxUint256).catch(() => {
      // general fallback for tokens which restrict approval amounts
      useExact = true
      return tokenContract.estimateGas.approve(new_fund_address, parsedAmount.quotient.toString())
    })

    await tokenContract
      .approve(new_fund_address, parsedAmount.quotient.toString(), {
        gasLimit: calculateGasMargin(estimatedGas),
      })
      .then((response) => {
        const eventProperties = {
          chain_id: chainId,
          token_symbol: 'XXX',
          token_address: '0xEAE906dC299ccd9Cd94584377d0F96Ce144c942f',
        }
        //sendAnalyticsEvent(EventName.APPROVE_TOKEN_TXN_SUBMITTED, eventProperties)
        return {
          response,
          tokenAddress: '0xEAE906dC299ccd9Cd94584377d0F96Ce144c942f',
          spenderAddress: new_fund_address,
        }
      })
      .catch((error: Error) => {
        throw error
      })

    console.log(1)
    // if (!factory || !baseCurrency) {
    //   return
    // }
    //if (currency && account && deadline) {

    if (factory && currency && account) {
      console.log(3)
      //const useNative = baseCurrency.isNative ? baseCurrency : undefined
      const { calldata, value } = XXXFund.depositParameters(
        account,
        inputCurrencyId,
        parsedAmount
        //deadline: deadline,
      )
      const txn: { to: string; data: string; value: string } = {
        to: new_fund_address,
        data: calldata,
        value,
      }
      // setAttemptingTxn(true)
      provider
        .getSigner()
        .estimateGas(txn)
        .then((estimate) => {
          const newTxn = {
            ...txn,
            gasLimit: calculateGasMargin(estimate),
          }
          return provider
            .getSigner()
            .sendTransaction(newTxn)
            .then((response: TransactionResponse) => {
              console.log(response)
              //setAttemptingTxn(false)
              addTransaction(response, {
                type: TransactionType.CREATE_FUND,
              })
              setTxHash(response.hash)
              // sendEvent({
              //   category: 'Fund',
              //   action: 'Create',
              //   label: ['test11111', 'test22222'].join('/'),
              // })
            })
        })
        .catch((error) => {
          console.error('Failed to send transaction', error)
          //setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          if (error?.code !== 4001) {
            console.error(error)
          }
        })
    } else {
      return
    }
  }

  return (
    <Grid container spacing={0} direction="column" alignItems="center" justifyContent="center">
      <Grid item xs={3}>
        <Box
          sx={{
            width: 500,
            height: 260,
            mt: 12,
            px: 1,
            backgroundColor: 'success.main',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Typography variant="button" display="block" gutterBottom sx={{ mt: 2 }}>
            Deposit
          </Typography>
          <CurrencyInputPanel
            value={typedValue}
            onUserInput={handleTypeInput}
            onCurrencySelect={handleCurrencySelect}
            currency={inputCurrencyId}
          />
          {(approval === ApprovalState.NOT_APPROVED || approval === ApprovalState.PENDING) && showApproval ? (
            <CustomButton onClick={() => approveCallback()} disabled={approval === ApprovalState.PENDING}>
              {approval === ApprovalState.PENDING ? (
                <Typography>Approving {inputCurrencyId}</Typography>
              ) : (
                <Typography>Approve {inputCurrencyId}</Typography>
              )}
            </CustomButton>
          ) : (
            <CustomButton onClick={() => onDeposit()}>Deposit</CustomButton>
          )}
        </Box>
      </Grid>
    </Grid>
  )
}
