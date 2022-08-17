import { ReactNode, useCallback, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { AppState } from '../index'
import { replaceCreateState, selectCurrency, setSender, typeInput } from './actions'
import { CreateState } from './reducer'
import { ParsedQs } from 'qs'
import { isAddress } from 'utils'
import { useWeb3React } from '@web3-react/core'


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
          currency: currencyAddress ? currencyAddress : '',
        })
      )
    },
    [dispatch]
  )

  const onUserInput = useCallback(
    (typedValue: string) => {
      dispatch(
        typeInput({ typedValue })
      )
    },
    [dispatch]
  )

  const onChangeSender = useCallback(
    (sender: string | null) => {
      dispatch(
        setSender({ sender })
      )
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
    currency : inputCurrency === '' ? '' : inputCurrency ?? '',
    typedValue,
    sender
  };
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
        currency: parsedCreateState.currency,
        typedValue: parsedCreateState.typedValue,
        sender: parsedCreateState.sender
      })
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return parsedCreateState
}