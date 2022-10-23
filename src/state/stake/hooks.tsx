import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { XXX_ADDRESS } from 'constants/addresses'
import { useXXXTokenContract } from 'hooks/useContract'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'

import { XXX } from '../../constants/tokens'

export interface StakingInfo {
  stakingRewardAddress: string
  unStakingBalance: CurrencyAmount<Token>
  // the amount of token currently staked, or undefined if no account
  stakedAmount: CurrencyAmount<Token>
  // the amount of reward token earned by the active account, or undefined if no account
  earnedAmount: CurrencyAmount<Token>
  // the total amount of token staked in the contract
  totalStakedAmount: CurrencyAmount<Token>
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
  const XXXTokenContract = useXXXTokenContract()

  const xxx = chainId ? XXX[chainId] : undefined

  // get all the info from the staking rewards contracts
  const balance = useSingleCallResult(XXXTokenContract, 'balanceOf')
  const earnedAmounts = useSingleCallResult(XXXTokenContract, 'earned')
  const totalSupplies = useSingleCallResult(XXXTokenContract, 'totalSupply')
  // tokens per second, constants
  const rewardRates = useSingleCallResult(XXXTokenContract, 'REWARD_RATE')
  const stakedAmount = useSingleCallResult(XXXTokenContract, 's_balances', [account])
  const totalStakedAmount = useSingleCallResult(XXXTokenContract, 's_totalSupply')

  if (!chainId || !xxx) return undefined

  // these two are dependent on account
  const balanceState = balance
  const earnedAmountState = earnedAmounts

  // these get fetched regardless of account
  const totalSupplyState = totalSupplies
  const rewardRateState = rewardRates

  if (
    // these may be undefined if not logged in
    !balanceState?.loading &&
    !earnedAmountState?.loading &&
    // always need these
    totalSupplyState &&
    !totalSupplyState.loading
  ) {
    if (balanceState?.error || earnedAmountState?.error || totalSupplyState.error) {
      console.error('Failed to load staking rewards info')
      return undefined
    }

    // check for account, if no account set to 0

    const totalRewardRate = CurrencyAmount.fromRawAmount(xxx, JSBI.BigInt(rewardRateState.result?.[0]))

    const getHypotheticalRewardRate = (
      stakedAmount: CurrencyAmount<Token>,
      totalStakedAmount: CurrencyAmount<Token>,
      totalRewardRate: CurrencyAmount<Token>
    ): CurrencyAmount<Token> => {
      return CurrencyAmount.fromRawAmount(
        xxx,
        JSBI.greaterThan(totalStakedAmount.quotient, JSBI.BigInt(0))
          ? JSBI.divide(JSBI.multiply(totalRewardRate.quotient, stakedAmount.quotient), totalStakedAmount.quotient)
          : JSBI.BigInt(0)
      )
    }

    const individualRewardRate = getHypotheticalRewardRate(
      stakedAmount.result?.[0],
      totalStakedAmount.result?.[0],
      totalRewardRate
    )

    return {
      stakingRewardAddress: XXX_ADDRESS[chainId],
      unStakingBalance: CurrencyAmount.fromRawAmount(xxx, JSBI.BigInt(balance?.result?.[0] ?? 0)),
      stakedAmount: CurrencyAmount.fromRawAmount(xxx, JSBI.BigInt(stakedAmount?.result?.[0] ?? 0)),
      earnedAmount: CurrencyAmount.fromRawAmount(xxx, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0)),
      totalStakedAmount: CurrencyAmount.fromRawAmount(xxx, JSBI.BigInt(totalStakedAmount?.result?.[0] ?? 0)),
      totalRewardRate,
      rewardRate: individualRewardRate,
      getHypotheticalRewardRate,
    }
  } else {
    return undefined
  }
}
