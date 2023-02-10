import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Investor, InvestorFields } from 'types/fund'

export const TOP_MANAGERS_BULK = () => {
  const queryString = `
    query investors {
      investors(orderBy: profitRatio, orderDirection: desc, where: { isManager: true } subgraphError: allow) {
        id
        createdAtTimestamp
        fund
        investor
        isManager
        principalETH
        principalUSD
        currentETH
        currentUSD
        currentTokens
        currentTokensSymbols
        currentTokensDecimals
        currentTokensAmount
        currentTokensAmountETH
        currentTokensAmountUSD
        tokenIds
        profitETH
        profitUSD
        profitRatio
      }
    }
  `
  return gql(queryString)
}

interface InvestorDataResponse {
  investors: InvestorFields[]
}

/**
 * Fetch top managers by profitRatio
 */
export function useTopManagers(): {
  loading: boolean
  error: boolean
  data: Investor[]
} {
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<InvestorDataResponse>(TOP_MANAGERS_BULK(), {
    client: dataClient,
  })

  const anyError = Boolean(error)
  const anyLoading = Boolean(loading)

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: [],
    }
  }

  const formatted: Investor[] = data
    ? data.investors.map((value, index) => {
        const investorFields = data.investors[index]
        const investorData: Investor = {
          createdAtTimestamp: parseFloat(investorFields.createdAtTimestamp),
          fund: investorFields.fund,
          investor: investorFields.investor,
          isManager: Boolean(investorFields.isManager),
          principalETH: parseFloat(investorFields.principalETH),
          principalUSD: parseFloat(investorFields.principalUSD),
          currentETH: parseFloat(investorFields.currentETH),
          currentUSD: parseFloat(investorFields.currentUSD),
          currentTokens: investorFields.currentTokens,
          currentTokensSymbols: investorFields.currentTokensSymbols,
          currentTokensDecimals: investorFields.currentTokensDecimals.map((value) => {
            return parseFloat(value)
          }),
          currentTokensAmount: investorFields.currentTokensAmount.map((value) => {
            return parseFloat(value)
          }),
          currentTokensAmountETH: investorFields.currentTokensAmountETH.map((value) => {
            return parseFloat(value)
          }),
          currentTokensAmountUSD: investorFields.currentTokensAmountUSD.map((value) => {
            return parseFloat(value)
          }),
          tokenIds: investorFields.tokenIds.map((value) => {
            return parseFloat(value)
          }),
          profitETH: parseFloat(investorFields.profitETH),
          profitUSD: parseFloat(investorFields.profitUSD),
          profitRatio: parseFloat(investorFields.profitRatio),
        }
        return investorData
      })
    : []

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
