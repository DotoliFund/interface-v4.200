import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ParsedQs } from 'qs'
import { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { FundToken } from 'types/fund'

import { TOKEN_SHORTHANDS } from '../../constants/tokens'
import { useCurrency } from '../../hooks/Tokens'
import useENS from '../../hooks/useENS'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { isAddress } from '../../utils'
import { AppState } from '../index'
import { Field, replaceFeeState, selectCurrency, setRecipient, typeInput } from './actions'
import { FeeState } from './reducer'

export function useFeeState(): AppState['fee'] {
  return useAppSelector((state) => state.fee)
}

export function useFeeActionHandlers(): {
  onCurrencySelection: (currency: Currency) => void
  onUserInput: (typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
} {
  const dispatch = useAppDispatch()
  const onCurrencySelection = useCallback(
    (currency: Currency) => {
      dispatch(
        selectCurrency({
          currencyId: currency.isToken ? currency.address : currency.isNative ? 'ETH' : '',
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

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }))
    },
    [dispatch]
  )

  return {
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
  }
}

const BAD_RECIPIENT_ADDRESSES: { [address: string]: true } = {
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f': true, // v2 factory
  '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a': true, // v2 router 01
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': true, // v2 router 02
}

// from the current fee inputs, compute the best trade and return it.
export function useDerivedFeeInfo(feeTokens: FundToken[]): {
  currency: Currency | null
  currencyBalance: CurrencyAmount<Currency> | undefined
  parsedAmount: CurrencyAmount<Currency> | undefined
  inputError?: ReactNode
} {
  const { account } = useWeb3React()

  const {
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId },
    recipient,
  } = useFeeState()

  const inputCurrency = useCurrency(inputCurrencyId)
  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  let feeTokenBalance = 0
  if (inputCurrency && feeTokens) {
    for (let i = 0; i < feeTokens.length; i++) {
      const feeTokenAddress = feeTokens[i].tokenAddress
      const currencyAddress = inputCurrency.wrapped.address
      if (currencyAddress.toUpperCase() === feeTokenAddress.toUpperCase()) {
        feeTokenBalance = feeTokens[i].amount
        break
      }
    }
  }

  const currencyBalance = inputCurrency
    ? CurrencyAmount.fromRawAmount(inputCurrency, JSBI.BigInt(feeTokenBalance.toString()))
    : undefined

  const currency: Currency | null = inputCurrency ? inputCurrency : null

  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, inputCurrency ?? undefined),
    [inputCurrency, typedValue]
  )

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
      inputError = inputError ?? <Trans>Enter a recipient</Trans>
    } else {
      if (BAD_RECIPIENT_ADDRESSES[formattedTo]) {
        inputError = inputError ?? <Trans>Invalid recipient</Trans>
      }
    }

    if (parsedAmount && currencyBalance?.lessThan(parsedAmount)) {
      inputError = <Trans>Insufficient {parsedAmount.currency.symbol} balance</Trans>
    }

    return inputError
  }, [account, currency, currencyBalance, parsedAmount, to])

  return useMemo(
    () => ({
      currency,
      currencyBalance,
      parsedAmount,
      inputError,
    }),
    [currency, currencyBalance, inputError, parsedAmount]
  )
}

function parseCurrencyFromURLParameter(urlParam: ParsedQs[string]): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    const upper = urlParam.toUpperCase()
    if (upper === 'ETH') return 'ETH'
    if (upper in TOKEN_SHORTHANDS) return upper
  }
  return ''
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
function validatedRecipient(recipient: any): string | null {
  if (typeof recipient !== 'string') return null
  const address = isAddress(recipient)
  if (address) return address
  if (ENS_NAME_REGEX.test(recipient)) return recipient
  if (ADDRESS_REGEX.test(recipient)) return recipient
  return null
}

export function queryParametersToFeeState(parsedQs: ParsedQs): FeeState {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency)
  const typedValue = parseTokenAmountURLParameter(parsedQs.exactAmount)

  if (inputCurrency === '' && typedValue === '') {
    // Defaults to having the native currency selected
    inputCurrency = 'ETH'
  }

  const recipient = validatedRecipient(parsedQs.recipient)

  return {
    [Field.INPUT]: {
      currencyId: inputCurrency === '' ? null : inputCurrency ?? null,
    },
    typedValue,
    recipient,
  }
}

// updates the fee state to use the defaults for a given network
export function useDefaultsFromURLSearch(): FeeState {
  const { chainId } = useWeb3React()
  const dispatch = useAppDispatch()
  const parsedQs = useParsedQueryString()

  const parsedFeeState = useMemo(() => {
    return queryParametersToFeeState(parsedQs)
  }, [parsedQs])

  useEffect(() => {
    if (!chainId) return
    const inputCurrencyId = parsedFeeState[Field.INPUT].currencyId ?? undefined

    dispatch(
      replaceFeeState({
        typedValue: parsedFeeState.typedValue,
        inputCurrencyId,
        recipient: parsedFeeState.recipient,
      })
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return parsedFeeState
}
