import { Interface } from '@ethersproject/abi'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import XXXStaking2Json from 'abis/XXXStaking2.json'
import JSBI from 'jsbi'

import { MethodParameters, toHex } from './utils/calldata'

const MaxUint128 = toHex(JSBI.subtract(JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)), JSBI.BigInt(1)))

export abstract class XXXStaking2 {
  public static INTERFACE: Interface = new Interface(XXXStaking2Json.abi)

  public static stakeCallParameters(amount: CurrencyAmount<Currency>): MethodParameters {
    const calldata: string = XXXStaking2.INTERFACE.encodeFunctionData('stake', [toHex(amount.quotient)])
    const value: string = toHex(0)
    return {
      calldata,
      value,
    }
  }

  public static withdrawCallParameters(amount: CurrencyAmount<Currency>): MethodParameters {
    const calldata: string = XXXStaking2.INTERFACE.encodeFunctionData('withdraw', [toHex(amount.quotient)])
    const value: string = toHex(0)
    return {
      calldata,
      value,
    }
  }

  public static claimRewardCallParameters(): MethodParameters {
    const calldata: string = XXXStaking2.INTERFACE.encodeFunctionData('claimReward', [])
    const value: string = toHex(0)
    return {
      calldata,
      value,
    }
  }
}
