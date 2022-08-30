import { useWeb3React } from '@web3-react/core'
import { ParsedQs } from 'qs'
import { useCallback, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { isAddress } from 'utils'

import useParsedQueryString from '../../hooks/useParsedQueryString'
import { AppState } from '../index'
import { replaceDepositState, selectCurrency, setSender, typeInput } from './actions'
import { DepositState } from './reducer'

export function useDepositState(): AppState['deposit'] {
  return useAppSelector((state) => state.deposit)
}

export function useDepositActionHandlers(): {
  onCurrencySelection: (currency: string) => void
  onUserInput: (typedValue: string) => void
  onChangeSender: (sender: string | null) => void
} {
  const dispatch = useAppDispatch()

  const onCurrencySelection = useCallback(
    (currencyAddress: string) => {
      dispatch(
        selectCurrency({
          currency: currencyAddress ? currencyAddress : '',
        })
      )
    },
    [dispatch]
  )

  const onUserInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ typedValue }))
    },
    [dispatch]
  )

  const onChangeSender = useCallback(
    (sender: string | null) => {
      dispatch(setSender({ sender }))
    },
    [dispatch]
  )

  return {
    onCurrencySelection,
    onUserInput,
    onChangeSender,
  }
}

function parseCurrencyFromURLParameter(urlParam: ParsedQs[string]): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    const upper = urlParam.toUpperCase()
    if (upper === 'ETH') return 'ETH'
  }
  return ''
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

function parseFundAccountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
function validatedSender(sender: any): string | null {
  if (typeof sender !== 'string') return null
  const address = isAddress(sender)
  if (address) return address
  if (ENS_NAME_REGEX.test(sender)) return sender
  if (ADDRESS_REGEX.test(sender)) return sender
  return null
}

export function queryParametersToDepositState(parsedQs: ParsedQs): DepositState {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency)
  const typedValue = parseTokenAmountURLParameter(parsedQs.exactAmount)
  const fundAccount = parseFundAccountURLParameter(parsedQs.fundAccount)

  if (inputCurrency === '' && typedValue === '') {
    // Defaults to having the native currency selected
    inputCurrency = 'ETH'
  }

  const sender = validatedSender(parsedQs.sender)

  return {
    currency: inputCurrency === '' ? '' : inputCurrency ?? '',
    typedValue,
    sender,
    fundAccount,
  }
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch(): DepositState {
  const { chainId } = useWeb3React()
  const dispatch = useAppDispatch()
  const parsedQs = useParsedQueryString()

  const parsedDepositState = useMemo(() => {
    return queryParametersToDepositState(parsedQs)
  }, [parsedQs])

  useEffect(() => {
    if (!chainId) return

    dispatch(
      replaceDepositState({
        currency: parsedDepositState.currency,
        typedValue: parsedDepositState.typedValue,
        sender: parsedDepositState.sender,
        fundAccount: parsedDepositState.fundAccount,
      })
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return parsedDepositState
}
