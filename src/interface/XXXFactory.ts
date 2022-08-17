import {
    BigintIsh,
    Percent,
    Token,
    CurrencyAmount,
    validateAndParseAddress,
    Currency,
    NativeCurrency
  } from '@uniswap/sdk-core'
  import JSBI from 'jsbi'
  import invariant from 'tiny-invariant'
  import { Fund } from 'interface/fund'
  import { ONE, ZERO } from './internalConstants'
  import { MethodParameters, toHex } from './utils/calldata'
  import { Interface } from '@ethersproject/abi'
  import IXXXFactory from 'abis/XXXFactory.json'
  import { Multicall } from './multicall'
  
  const MaxUint128 = toHex(JSBI.subtract(JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)), JSBI.BigInt(1)))
  
  export interface MintSpecificOptions {
    /**
     * The account that should receive the minted NFT.
     */
    recipient: string
  
    /**
     * When the transaction expires, in epoch seconds.
     */
    deadline: BigintIsh
  }
  
  export interface IncreaseSpecificOptions {
    /**
     * Indicates the ID of the position to increase liquidity for.
     */
    tokenId: BigintIsh
  }
  
  /**
   * Options for producing the calldata to add liquidity.
   */
  export interface CommonAddLiquidityOptions {
    /**
     * When the transaction expires, in epoch seconds.
     */
    deadline: BigintIsh
  
    /**
     * Whether to spend ether. If true, one of the pool tokens must be WETH, by default false
     */
    useNative?: NativeCurrency
  }
  
  export type MintOptions = CommonAddLiquidityOptions & MintSpecificOptions
  export type IncreaseOptions = CommonAddLiquidityOptions & IncreaseSpecificOptions
  
  export type AddLiquidityOptions = MintOptions | IncreaseOptions
  
  export abstract class XXXFactory {
    public static INTERFACE: Interface = new Interface(IXXXFactory.abi)
  
    /**
     * Cannot be constructed.
     */
    private constructor() {}
  
    public static createFundParameters(fund: Fund): MethodParameters {
      const _amount = JSBI.BigInt(fund.amount)
      invariant(JSBI.greaterThan(_amount, ZERO), 'ZERO_LIQUIDITY')
      const calldatas: string[] = []
      //const deadline = toHex(JSBI.BigInt(fund.deadline))
      const manager: string = validateAndParseAddress(fund.manager)

      calldatas.push(
          XXXFactory.INTERFACE.encodeFunctionData('createFund', [
          {
            token: fund.token,
            amount: toHex(_amount),
            manager: manager,
            //deadline: deadline
          }
        ])
      )
  
      let value: string = toHex(0)

      return {
        calldata: Multicall.encodeMulticall(calldatas),
        value
      }
    }
  }