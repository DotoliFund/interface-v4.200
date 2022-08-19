import { CurrencyAmount, Currency } from '@uniswap/sdk-core'
import { computeFundAddress } from './utils/computeFundAddress'

/**
 * Represents a fund
 */
export class Fund {
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
   * @param manager fund's address
   */
  public constructor(
    _token: string,
    _amount: CurrencyAmount<Currency>,
    _manager: string,
    //_deadline: BigNumber
  ) {
    this.manager = _manager
    //this.deadline = _deadline
  }
}