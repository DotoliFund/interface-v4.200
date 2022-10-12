import { NULL_ADDRESS } from 'constants/addresses'
import gql from 'graphql-tag'
import { useClients } from 'state/application/hooks'
import { Investor, InvestorFields } from 'types/fund'

const FUND_INVESTORS = gql`
  query investors($fund: Bytes!) {
    investors(first: 100, orderBy: principalETH, orderDirection: desc, where: { id: $fund }, subgraphError: allow) {
      id
      createdAtTimestamp
      createdAtBlockNumber
      fund
      investor
      principalETH
      principalUSD
      volumeETH
      volumeUSD
      profitETH
      profitUSD
      profitRatioETH
      profitRatioUSD
    }
  }
`

interface InvestorResponse {
  investors: InvestorFields[]
}

/**
 * Fetch InvestorData
 */
export async function useFundInvestors(fund: string | undefined): Promise<{
  loading: boolean
  error: boolean
  data: Investor[] | undefined
}> {
  if (!fund) {
    fund = NULL_ADDRESS
  }
  // get client
  const { dataClient } = useClients()

  const { data, error, loading } = await dataClient.query<InvestorResponse>({
    query: FUND_INVESTORS,
    variables: {
      fund,
    },
    fetchPolicy: 'cache-first',
  })

  if (error) {
    return {
      data: undefined,
      error: true,
      loading: false,
    }
  }

  if (loading && !data) {
    return {
      data: undefined,
      error: false,
      loading: true,
    }
  }

  const investors: Investor[] = data
    ? data.investors.map((value, index) => {
        const investorDataFields = data.investors[index]
        const investorData: Investor = {
          id: investorDataFields.id,
          createdAtTimestamp: parseFloat(investorDataFields.createdAtTimestamp),
          createdAtBlockNumber: parseFloat(investorDataFields.createdAtBlockNumber),
          fund: investorDataFields.fund,
          investor: investorDataFields.investor,
          principalETH: parseFloat(investorDataFields.principalETH),
          principalUSD: parseFloat(investorDataFields.principalUSD),
          volumeETH: parseFloat(investorDataFields.volumeETH),
          volumeUSD: parseFloat(investorDataFields.volumeUSD),
          profitETH: parseFloat(investorDataFields.profitETH),
          profitUSD: parseFloat(investorDataFields.profitUSD),
          profitRatioETH: parseFloat(investorDataFields.profitRatioETH),
          profitRatioUSD: parseFloat(investorDataFields.profitRatioUSD),
        }
        return investorData
      })
    : []

  return { data: [...investors], error: false, loading: false }
}
