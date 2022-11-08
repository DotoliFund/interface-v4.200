import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useCurrency } from 'hooks/Tokens'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'

import { useXXXFund2Contract } from './useContract'

export default function useInvestorCurrencyBalance(
  fund: string | undefined,
  investor: string | undefined,
  token: string | undefined
): CurrencyAmount<Currency> | undefined {
  const XXXFund2Contract = useXXXFund2Contract(fund)
  const inputCurrency = useCurrency(token)

  const { loading: tokenBalancesLoading, result: [tokenBalances] = [] } = useSingleCallResult(
    XXXFund2Contract,
    'getInvestorTokenAmount',
    [investor, token]
  )
  if (!tokenBalancesLoading && inputCurrency && tokenBalances) {
    return CurrencyAmount.fromRawAmount(inputCurrency, JSBI.BigInt(tokenBalances.toString()))
  } else {
    return undefined
  }
}
