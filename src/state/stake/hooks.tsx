import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { DOTOLI_ADDRESS } from 'constants/addresses'
import { useDotoliStakingContract, useTokenContract } from 'hooks/useContract'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'

import { DTL } from '../../constants/tokens'

export interface StakingInfo {
  stakingRewardAddress: string
  unStakingBalance: CurrencyAmount<Token>
  // the amount of token currently staked, or undefined if no account
  stakedAmount: CurrencyAmount<Token>
  // the amount of reward token reward by the active account, or undefined if no account
  rewardAmount: CurrencyAmount<Token>
  // the total amount of token staked in the contract
  totalStakedAmount: CurrencyAmount<Token>
  // the total amount of token staked in the contract
  remainingReward: CurrencyAmount<Token>
  // the amount of token distributed per second to all LPs, constant
  totalRewardRate: CurrencyAmount<Token>
  // the current amount of token distributed to the active account per second.
  // equivalent to percent of total supply * reward rate
  rewardRate: CurrencyAmount<Token>
  // calculates a hypothetical amount of token distributed to the active account per second.
  getHypotheticalRewardRate: (
    stakedAmount: CurrencyAmount<Token>,
    totalStakedAmount: CurrencyAmount<Token>,
    totalRewardRate: CurrencyAmount<Token>
  ) => CurrencyAmount<Token>
}

// gets the staking info from the network for the active chain id
export function useStakingInfo(): StakingInfo | undefined {
  const { chainId, account } = useWeb3React()
  const DotoliStakingContract = useDotoliStakingContract()
  const tokenContract = useTokenContract(chainId ? DOTOLI_ADDRESS[chainId] : undefined)
  const dtl = chainId ? DTL[chainId] : undefined

  // get all the info from the staking rewards contracts
  const balance = useSingleCallResult(tokenContract, 'balanceOf', [account])
  const rewardAmounts = useSingleCallResult(DotoliStakingContract, 'reward', [account])
  const totalSupplies = useSingleCallResult(tokenContract, 'totalSupply')
  // tokens per second, constants
  const rewardRates = useSingleCallResult(DotoliStakingContract, 'REWARD_RATE')
  const stakedAmount = useSingleCallResult(DotoliStakingContract, 's_balances', [account])
  const totalStakedAmount = useSingleCallResult(DotoliStakingContract, 's_totalStakedSupply')
  // get conract remain reward
  const maxReward = useSingleCallResult(DotoliStakingContract, 'maxReward')
  const totalClaimedReward = useSingleCallResult(DotoliStakingContract, 'totalClaimedReward')

  if (!chainId || !dtl) return undefined

  // these two are dependent on account
  const balanceState = balance
  const rewardAmountState = rewardAmounts

  // these get fetched regardless of account
  const totalSupplyState = totalSupplies
  const rewardRateState = rewardRates

  if (
    // these may be undefined if not logged in
    !balanceState?.loading &&
    !rewardAmountState?.loading &&
    // always need these
    totalSupplyState &&
    !totalSupplyState.loading
  ) {
    if (balanceState?.error || rewardAmountState?.error || totalSupplyState.error) {
      console.error('Failed to load staking rewards info')
      return undefined
    }

    // check for account, if no account set to 0

    const totalRewardRate = CurrencyAmount.fromRawAmount(dtl, JSBI.BigInt(rewardRateState.result?.[0]))

    const getHypotheticalRewardRate = (
      stakedAmount: CurrencyAmount<Token>,
      totalStakedAmount: CurrencyAmount<Token>,
      totalRewardRate: CurrencyAmount<Token>
    ): CurrencyAmount<Token> => {
      return CurrencyAmount.fromRawAmount(
        dtl,
        JSBI.greaterThan(JSBI.BigInt(totalStakedAmount.toString()), JSBI.BigInt(0))
          ? JSBI.divide(
              JSBI.multiply(JSBI.BigInt(totalRewardRate.quotient.toString()), JSBI.BigInt(stakedAmount.toString())),
              JSBI.BigInt(totalStakedAmount.toString())
            )
          : JSBI.BigInt(0)
      )
    }

    const individualRewardRate = getHypotheticalRewardRate(
      stakedAmount.result?.[0],
      totalStakedAmount.result?.[0],
      totalRewardRate
    )

    return {
      stakingRewardAddress: DOTOLI_ADDRESS[chainId],
      unStakingBalance: CurrencyAmount.fromRawAmount(dtl, JSBI.BigInt(balance?.result?.[0] ?? 0)),
      stakedAmount: CurrencyAmount.fromRawAmount(dtl, JSBI.BigInt(stakedAmount?.result?.[0] ?? 0)),
      rewardAmount: CurrencyAmount.fromRawAmount(dtl, JSBI.BigInt(rewardAmountState?.result?.[0] ?? 0)),
      totalStakedAmount: CurrencyAmount.fromRawAmount(dtl, JSBI.BigInt(totalStakedAmount?.result?.[0] ?? 0)),
      remainingReward: CurrencyAmount.fromRawAmount(
        dtl,
        JSBI.subtract(JSBI.BigInt(maxReward?.result?.[0] ?? 0), JSBI.BigInt(totalClaimedReward?.result?.[0] ?? 0))
      ),
      totalRewardRate,
      rewardRate: individualRewardRate,
      getHypotheticalRewardRate,
    }
  } else {
    return undefined
  }
}
