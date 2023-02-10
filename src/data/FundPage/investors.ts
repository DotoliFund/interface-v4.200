import { useQuery } from '@apollo/client'
import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Investor, InvestorFields } from 'types/fund'

const FUND_INVESTORS = gql`
  query investors($fund: Bytes!) {
    investors(first: 100, orderBy: principalUSD, orderDirection: desc, where: { fund: $fund }, subgraphError: allow) {
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

interface InvestorResponse {
  investors: InvestorFields[]
}

/**
 * Fetch InvestorData
 */
export function useFundInvestors(fund: string | undefined): {
  loading: boolean
  error: boolean
  data: Investor[] | undefined
} {
  if (!fund) {
    fund = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const { loading, error, data } = useQuery<InvestorResponse>(FUND_INVESTORS, {
    variables: { fund },
    client: dataClient,
  })

  const anyError = Boolean(error)
  const anyLoading = Boolean(loading)

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: undefined,
    }
  }

  const investors: Investor[] = data
    ? data.investors.map((value, index) => {
        const investorDataFields = data.investors[index]
        const investorData: Investor = {
          createdAtTimestamp: parseFloat(investorDataFields.createdAtTimestamp),
          fund: investorDataFields.fund,
          investor: investorDataFields.investor,
          isManager: Boolean(investorDataFields.isManager),
          principalETH: parseFloat(investorDataFields.principalETH),
          principalUSD: parseFloat(investorDataFields.principalUSD),
          currentETH: parseFloat(investorDataFields.currentETH),
          currentUSD: parseFloat(investorDataFields.currentUSD),
          currentTokens: investorDataFields.currentTokens,
          currentTokensSymbols: investorDataFields.currentTokensSymbols,
          currentTokensDecimals: investorDataFields.currentTokensDecimals.map((value) => {
            return parseFloat(value)
          }),
          currentTokensAmount: investorDataFields.currentTokensAmount.map((value) => {
            return parseFloat(value)
          }),
          currentTokensAmountETH: investorDataFields.currentTokensAmountETH.map((value) => {
            return parseFloat(value)
          }),
          currentTokensAmountUSD: investorDataFields.currentTokensAmountUSD.map((value) => {
            return parseFloat(value)
          }),
          tokenIds: investorDataFields.tokenIds.map((value) => {
            return parseFloat(value)
          }),
          profitETH: parseFloat(investorDataFields.profitETH),
          profitUSD: parseFloat(investorDataFields.profitUSD),
          profitRatio: parseFloat(investorDataFields.profitRatio),
        }
        return investorData
      })
    : []

  return { data: [...investors], error: false, loading: false }
}
