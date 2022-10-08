import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useCurrency } from 'hooks/Tokens'
import useENS from 'hooks/useENS'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ParsedQs } from 'qs'
import { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { isAddress } from 'utils'

import useParsedQueryString from '../../hooks/useParsedQueryString'
import { useCurrencyBalances } from '../connection/hooks'
import { AppState } from '../index'
import { replaceCreateState, selectCurrency, setSender, typeInput } from './actions'
import { CreateState } from './reducer'

export function useCreateState(): AppState['create'] {
  return useAppSelector((state) => state.create)
}

export function useCreateActionHandlers(): {
  onCurrencySelection: (currency: string) => void
  onUserInput: (typedValue: string) => void
  onChangeSender: (sender: string | null) => void
} {
  const dispatch = useAppDispatch()

  const onCurrencySelection = useCallback(
    (currencyAddress: string) => {
      dispatch(
        selectCurrency({
          inputCurrencyId: currencyAddress ? currencyAddress : '',
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

//TODO change
const BAD_RECIPIENT_ADDRESSES: { [address: string]: true } = {
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f': true, // v2 factory
  '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a': true, // v2 router 01
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': true, // v2 router 02
}

export function useDerivedCreateInfo(): {
  currency?: Currency | null
  currencyBalance?: CurrencyAmount<Currency>
  parsedAmount: CurrencyAmount<Currency> | undefined
  inputError?: ReactNode
} {
  const { account } = useWeb3React()

  const { inputCurrencyId, typedValue, sender } = useCreateState()

  const inputCurrency: Currency | undefined | null = useCurrency(inputCurrencyId)
  const senderLookup = useENS(sender ?? undefined)
  const to: string | null = (sender === null ? account : senderLookup.address) ?? null

  const relevantTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [inputCurrency ?? undefined], [inputCurrency])
  )

  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, inputCurrency ?? undefined),
    [inputCurrency, typedValue]
  )

  const currencyBalance = relevantTokenBalances[0]

  const currency: Currency | null | undefined = inputCurrency

  const inputError = useMemo(() => {
    let inputError: ReactNode | undefined

    if (!account) {
      inputError = <Trans>Connect Wallet</Trans>
    }

    if (!currency) {
      inputError = inputError ?? <Trans>Select a token</Trans>
    }

    if (!parsedAmount) {
      inputError = inputError ?? <Trans>Enter an amount</Trans>
    }

    const formattedTo = isAddress(to)
    if (!to || !formattedTo) {
      inputError = inputError ?? <Trans>Enter a sender</Trans>
    } else {
      if (BAD_RECIPIENT_ADDRESSES[formattedTo]) {
        inputError = inputError ?? <Trans>Invalid sender</Trans>
      }
    }

    // compare input balance to max input based on version
    const [balanceIn, amountIn] = [currencyBalance, parsedAmount]
    if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
      inputError = <Trans>Insufficient {amountIn.currency.symbol} balance</Trans>
    }

    return inputError
  }, [account, currency, currencyBalance, parsedAmount, to])

  return {
    currency,
    currencyBalance,
    parsedAmount,
    inputError,
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

export function queryParametersToCreateState(parsedQs: ParsedQs): CreateState {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency)
  const typedValue = parseTokenAmountURLParameter(parsedQs.exactAmount)

  if (inputCurrency === '' && typedValue === '') {
    // Defaults to having the native currency selected
    inputCurrency = 'ETH'
  }

  const sender = validatedSender(parsedQs.sender)

  return {
    inputCurrencyId: inputCurrency === '' ? '' : inputCurrency ?? '',
    typedValue,
    sender,
  }
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch(): CreateState {
  const { chainId } = useWeb3React()
  const dispatch = useAppDispatch()
  const parsedQs = useParsedQueryString()

  const parsedCreateState = useMemo(() => {
    return queryParametersToCreateState(parsedQs)
  }, [parsedQs])

  useEffect(() => {
    if (!chainId) return

    dispatch(
      replaceCreateState({
        inputCurrencyId: parsedCreateState.inputCurrencyId,
        typedValue: parsedCreateState.typedValue,
        sender: parsedCreateState.sender,
      })
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return parsedCreateState
}
