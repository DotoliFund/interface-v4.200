import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { computeFundAddress } from './utils/computeFundAddress'
import { BigNumber } from '@ethersproject/bignumber'

/**
 * Represents a fund
 */
export class Fund {
  public readonly token: string
  public readonly amount: string
  public readonly manager: string
  //public readonly deadline: BigNumber

  public static getFundAddress(
    factoryAddress: string,
    manager: string,
    initCodeHashManualOverride?: string
  ): string {
    return computeFundAddress({
      factoryAddress,
      manager,
      initCodeHashManualOverride
    })
  }

  /**
   * Construct a fund
   * @param token One of the tokens in the fund
   * @param amount Amount of token
   * @param fundAddress fund's address
   */
  public constructor(
    _token: string,
    _amount: string,
    _manager: string,
    //_deadline: BigNumber
  ) {
    this.token = _token
    this.amount = _amount
    this.manager = _manager
    //this.deadline = _deadline
  }
}