import { ParsedQs } from 'qs'
import { isAddress } from 'utils'

import { CreateState } from './reducer'

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
