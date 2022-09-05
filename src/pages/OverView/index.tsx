import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import { styled } from '@mui/material/styles'
import { useWeb3React } from '@web3-react/core'
import { ButtonLight } from 'components/Button'
import { NEWFUND_ADDRESS } from 'constants/addresses'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useTokenContract } from 'hooks/useContract'
import { useXXXFactoryContract } from 'hooks/useContract'
import { XXXFund } from 'interface/XXXFund'
import React from 'react'
import { useCreateActionHandlers, useCreateState, useDerivedCreateInfo } from 'state/create/hooks'
import { calculateGasMargin } from 'utils/calculateGasMargin'

import DoughnutChart from '../../components/Chart/DoughnutChart'
import LineChart from '../../components/Chart/LineChart'
import EnhancedTable from '../../components/Table'

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}))

export default function OverView() {
  const { account, chainId, provider } = useWeb3React()
  const factory = useXXXFactoryContract()
  const { onCurrencySelection, onUserInput, onChangeSender } = useCreateActionHandlers()

  // create state
  const { inputCurrencyId, typedValue, sender } = useCreateState()
  const { currency, currencyBalance, parsedAmount, inputError } = useDerivedCreateInfo()

  const new_fund_address = NEWFUND_ADDRESS

  // check whether the user has approved the router on the tokens
  const [approval, approveCallback] = useApproveCallback(parsedAmount, new_fund_address)
  // we need an existence check on parsed amounts for single-asset deposits
  const showApproval = approval !== ApprovalState.APPROVED && !!parsedAmount

  //const tokenContract = useTokenContract(XXXToken_ADDRESS)
  const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  const tokenContract = useTokenContract(WETH)
  const WETHAmount = '0.3'
  //TODO the graph
  function isExistingFund(account: string): boolean {
    return false
  }

  async function onDeposit() {
    onUserInput(WETHAmount)
    if (!chainId || !provider || !account) return
    if (!parsedAmount) return

    console.log(parsedAmount.quotient.toString())

    if (!tokenContract) return
    let useExact = false
    const estimatedGas = await tokenContract.estimateGas.approve(new_fund_address, MaxUint256).catch(() => {
      // general fallback for tokens which restrict approval amounts
      useExact = true
      return tokenContract.estimateGas.approve(new_fund_address, parsedAmount.quotient.toString())
      //return tokenContract.estimateGas.approve(new_fund_address, WETHAmount)
    })
    console.log(1111)
    await tokenContract
      .approve(new_fund_address, parsedAmount.quotient.toString(), {
        //.approve(new_fund_address, WETHAmount, {
        gasLimit: calculateGasMargin(estimatedGas),
      })
      .then((response) => {
        console.log(2222)
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
    console.log(2222)
    if (factory && currency && account) {
      console.log(3)
      const txn: { to: string; data: string; value: string } = {
        to: new_fund_address,
        data: XXXFund.INTERFACE.encodeFunctionData('deposit', [
          account,
          WETH,
          1,
          //WETHAmount,
          //deadline: deadline
        ]),
        value: '0.3',
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
              //addTransaction(response, {
              //  type: TransactionType.CREATE_FUND,
              //})
              //setTxHash(response.hash)
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

  function onWithdraw() {
    return
  }

  return (
    <div>
      <ButtonLight onClick={() => onDeposit()}>deposit</ButtonLight>
      <ButtonLight onClick={() => onWithdraw()}>withdraw</ButtonLight>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <LineChart />
        </Grid>
        <Grid item xs={4}>
          <LineChart />
        </Grid>
        <Grid item xs={4}>
          <DoughnutChart />
        </Grid>
      </Grid>
      <EnhancedTable />
    </div>
  )
}
