import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCurrency } from 'hooks/Tokens'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'

import { useDotoliFundContract } from './useContract'

export default function useInvestorCurrencyBalance(
  fundId: string | undefined,
  investor: string | undefined,
  token: string | undefined
): CurrencyAmount<Currency> | undefined {
  const DotoliFundContract = useDotoliFundContract()
  const inputCurrency = useCurrency(token)

  const { loading: tokenBalancesLoading, result: [tokenBalances] = [] } = useSingleCallResult(
    DotoliFundContract,
    'getInvestorTokenAmount',
    [fundId, investor, token]
  )
  if (!tokenBalancesLoading && inputCurrency && tokenBalances) {
    return CurrencyAmount.fromRawAmount(inputCurrency, JSBI.BigInt(tokenBalances.toString()))
  } else {
    return undefined
  }
}
