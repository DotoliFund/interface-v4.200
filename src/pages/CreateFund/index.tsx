import { useCallback } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { styled, Container  } from '@mui/system'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import { CustomButton } from '../../components/Button'
import CurrencyInputPanel from '../../components/createFund/CurrencyInputPanel'


import { useWeb3React } from '@web3-react/core'
import { useXXXFactoryContract } from 'hooks/useContract'
import { useCurrency } from 'hooks/Tokens'
import { useParams } from 'react-router-dom'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { XXXFactory } from 'interface/XXXFactory'
import { FACTORY_ADDRESS } from 'interface/constants'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { sendEvent } from 'components/analytics'
import { useState } from 'react'
import { useDerivedCreateInfo, useCreateState, useCreateActionHandlers } from 'state/create/hooks'


export default function CreateFund() {
  const { account, chainId, provider } = useWeb3React()
  const { onCurrencySelection, onUserInput, onChangeSender } = useCreateActionHandlers()
  const factory = useXXXFactoryContract()
  const addTransaction = useTransactionAdder()
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

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm
  
  // txn values
  const deadline = useTransactionDeadline() // custom from users settings
  const [txHash, setTxHash] = useState<string>('')

  // create state
  const { inputCurrencyId, typedValue, sender } = useCreateState()
  const { currency, currencyBalance, parsedAmount, inputError } = useDerivedCreateInfo()

  async function onCreate() {
    if (!chainId || !provider || !account) return
    if (isExistingFund(account)) return
    // if (!factory || !baseCurrency) {
    //   return
    // }
    //if (currency && account && deadline) {
    if (factory && currency && account) {
      //const useNative = baseCurrency.isNative ? baseCurrency : undefined
      const { calldata, value } = XXXFactory.createFundParameters({
        token: inputCurrencyId,
        amount: typedValue,
        manager: account,
        //deadline: deadline,
      });
      console.log(3)
      let txn: { to: string; data: string; value: string } = {
        to: FACTORY_ADDRESS[chainId],
        data: calldata,
        value,
      }
      // setAttemptingTxn(true)
      console.log(4)
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
            Create a fund
          </Typography>
          <CurrencyInputPanel 
            value={typedValue}
            onUserInput={handleTypeInput}
            onCurrencySelect={handleCurrencySelect}
            currency={inputCurrencyId}
          />
          <CustomButton onClick={() => onCreate()}>Button</CustomButton>
            
        </Box>
      </Grid>   
    </Grid> 

  );
}