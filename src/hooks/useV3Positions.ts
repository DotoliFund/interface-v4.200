import { BigNumber } from '@ethersproject/bignumber'
import { NULL_ADDRESS } from 'constants/addresses'
import { CallStateResult, useSingleCallResult, useSingleContractMultipleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { PositionDetails } from 'types/position'

import { useXXXFund2Contract } from './useContract'
import { useV3NFTPositionManagerContract } from './useContract'

interface UseV3PositionsResults {
  loading: boolean
  positions: PositionDetails[] | undefined
}

function useV3PositionsFromTokenIds(
  fund: string,
  investor: string,
  tokenIds: BigNumber[] | undefined
): UseV3PositionsResults {
  const positionManager = useV3NFTPositionManagerContract()
  const inputs = useMemo(() => (tokenIds ? tokenIds.map((tokenId) => [BigNumber.from(tokenId)]) : []), [tokenIds])
  const results = useSingleContractMultipleData(positionManager, 'positions', inputs)

  const loading = useMemo(() => results.some(({ loading }) => loading), [results])
  const error = useMemo(() => results.some(({ error }) => error), [results])

  const positions = useMemo(() => {
    if (!loading && !error && tokenIds) {
      return results.map((call, i) => {
        const tokenId = tokenIds[i]
        const result = call.result as CallStateResult
        return {
          fund,
          investor,
          tokenId,
          fee: result.fee,
          feeGrowthInside0LastX128: result.feeGrowthInside0LastX128,
          feeGrowthInside1LastX128: result.feeGrowthInside1LastX128,
          liquidity: result.liquidity,
          nonce: result.nonce,
          operator: result.operator,
          tickLower: result.tickLower,
          tickUpper: result.tickUpper,
          token0: result.token0,
          token1: result.token1,
          tokensOwed0: result.tokensOwed0,
          tokensOwed1: result.tokensOwed1,
        }
      })
    }
    return undefined
  }, [fund, investor, loading, error, results, tokenIds])

  return {
    loading,
    positions: positions?.map((position, i) => ({ ...position, tokenId: inputs[i][0] })),
  }
}

interface UseV3PositionResults {
  loading: boolean
  position: PositionDetails | undefined
}

export function useV3PositionFromTokenId(
  fund: string,
  investor: string,
  tokenId: BigNumber | undefined
): UseV3PositionResults {
  const position = useV3PositionsFromTokenIds(fund, investor, tokenId ? [tokenId] : undefined)
  return {
    loading: position.loading,
    position: position.positions?.[0],
  }
}

export function useV3Positions(
  fund: string | null | undefined,
  investor: string | null | undefined
): UseV3PositionsResults {
  const XXXFund2Contract = useXXXFund2Contract(fund ?? NULL_ADDRESS)

  const { loading: tokenIdResultsLoading, result: [tokenIdResults] = [] } = useSingleCallResult(
    XXXFund2Contract,
    'getPositionTokenIds',
    [investor ?? undefined]
  )

  const tokenIds = useMemo(() => {
    if (tokenIdResults) {
      return tokenIdResults.map((result: number) => BigNumber.from(result))
    }
    return []
  }, [tokenIdResults])

  const { positions, loading: positionsLoading } = useV3PositionsFromTokenIds(
    fund ?? NULL_ADDRESS,
    investor ?? NULL_ADDRESS,
    tokenIds
  )

  return {
    loading: tokenIdResultsLoading || positionsLoading,
    positions,
  }
}
