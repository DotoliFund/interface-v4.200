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
  import { ONE, ZERO } from './internalConstants'
  import { MethodParameters, toHex } from './utils/calldata'
  import { Interface } from '@ethersproject/abi'
  import IXXXFund from 'abis/XXXFund.json'
  import { Multicall } from './multicall'
  import { BigNumber } from 'ethers'
  import { XXXToken_ADDRESS } from 'constants/addresses'

  const MaxUint128 = toHex(JSBI.subtract(JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)), JSBI.BigInt(1)))
  const token_address = XXXToken_ADDRESS

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
  
  export abstract class XXXFund {
    public static INTERFACE: Interface = new Interface(IXXXFund.abi)
  
    /**
     * Cannot be constructed.
     */
    private constructor() {}
  
    public static depositParameters(
        account: string,
        token: string,
        amount: CurrencyAmount<Currency>
    ): MethodParameters {
      const calldatas: string[] = []
      //const deadline = toHex(JSBI.BigInt(fund.deadline))
      const investor: string = validateAndParseAddress(account)
      // console.log(_amount)
      // console.log(_amount.quotient)
      // console.log(toHex(_amount.quotient))
      // console.log(_amount.toExact())
      // console.log(_amount.toFixed())
      // console.log(_amount.toSignificant(6))

      console.log('investor : ' + investor)
      console.log('amount.quotient : ' + toHex(amount.quotient))
      calldatas.push(
        XXXFund.INTERFACE.encodeFunctionData('deposit', [
          investor,
          token_address,
          toHex(amount.quotient)
          //deadline: deadline
        ])
      )
      // calldatas.push(
      //     XXXFactory.INTERFACE.encodeFunctionData('createFund', [
      //     {
      //       manager: manager,
      //       //token: fund.token,
      //       token: '0xEAE906dC299ccd9Cd94584377d0F96Ce144c942f',
      //       amount: 1
      //       //amount: toHex(_amount.quotient),
      //       //deadline: deadline
      //     }
      //   ])
      // )
  
      let value: string = toHex(0)

      return {
        calldata: Multicall.encodeMulticall(calldatas),
        value
      }
    }


    public static withdrawParameters(
        account: string,
        token: string,
        amount: CurrencyAmount<Currency>
    ): MethodParameters {
      const calldatas: string[] = []
      //const deadline = toHex(JSBI.BigInt(fund.deadline))
      const investor: string = validateAndParseAddress(account)

      // console.log(_amount)
      // console.log(_amount.quotient)
      // console.log(toHex(_amount.quotient))
      // console.log(_amount.toExact())
      // console.log(_amount.toFixed())
      // console.log(_amount.toSignificant(6))

      console.log('investor : ' + investor)
      console.log('amount.quotient : ' + toHex(amount.quotient))
      calldatas.push(
        XXXFund.INTERFACE.encodeFunctionData('withdraw', [
          investor,
          token_address,
          toHex(amount.quotient)
          //deadline: deadline
        ])
      )
      // calldatas.push(
      //     XXXFactory.INTERFACE.encodeFunctionData('createFund', [
      //     {
      //       manager: manager,
      //       //token: fund.token,
      //       token: '0xEAE906dC299ccd9Cd94584377d0F96Ce144c942f',
      //       amount: 1
      //       //amount: toHex(_amount.quotient),
      //       //deadline: deadline
      //     }
      //   ])
      // )
  
      let value: string = toHex(0)

      return {
        calldata: Multicall.encodeMulticall(calldatas),
        value
      }
    }
  }