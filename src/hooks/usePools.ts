import { Interface } from '@ethersproject/abi'
import { BigintIsh, Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import IUniswapV3PoolState from '@uniswap/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json'
import { computePoolAddress } from '@uniswap/v3-sdk'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { USDC, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import JSBI from 'jsbi'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { useMemo } from 'react'
import { IUniswapV3PoolStateInterface } from 'types/v3/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState'

import { V3_CORE_FACTORY_ADDRESSES } from '../constants/addresses'

const POOL_STATE_INTERFACE = new Interface(IUniswapV3PoolState.abi) as IUniswapV3PoolStateInterface

// Classes are expensive to instantiate, so this caches the recently instantiated pools.
// This avoids re-instantiating pools as the other pools in the same request are loaded.
class PoolCache {
  // Evict after 128 entries. Empirically, a swap uses 64 entries.
  private static MAX_ENTRIES = 128

  // These are FIFOs, using unshift/pop. This makes recent entries faster to find.
  private static pools: Pool[] = []
  private static addresses: { key: string; address: string }[] = []

  static getPoolAddress(factoryAddress: string, tokenA: Token, tokenB: Token, fee: FeeAmount): string {
    if (this.addresses.length > this.MAX_ENTRIES) {
      this.addresses = this.addresses.slice(0, this.MAX_ENTRIES / 2)
    }

    const { address: addressA } = tokenA
    const { address: addressB } = tokenB
    const key = `${factoryAddress}:${addressA}:${addressB}:${fee.toString()}`
    const found = this.addresses.find((address) => address.key === key)
    if (found) return found.address

    const address = {
      key,
      address: computePoolAddress({
        factoryAddress,
        tokenA,
        tokenB,
        fee,
      }),
    }
    this.addresses.unshift(address)
    return address.address
  }

  static getPool(
    tokenA: Token,
    tokenB: Token,
    fee: FeeAmount,
    sqrtPriceX96: BigintIsh,
    liquidity: BigintIsh,
    tick: number
  ): Pool {
    if (this.pools.length > this.MAX_ENTRIES) {
      this.pools = this.pools.slice(0, this.MAX_ENTRIES / 2)
    }

    const found = this.pools.find(
      (pool) =>
        pool.token0 === tokenA &&
        pool.token1 === tokenB &&
        pool.fee === fee &&
        JSBI.EQ(pool.sqrtRatioX96, sqrtPriceX96) &&
        JSBI.EQ(pool.liquidity, liquidity) &&
        pool.tickCurrent === tick
    )
    if (found) return found

    const pool = new Pool(tokenA, tokenB, fee, sqrtPriceX96, liquidity, tick)
    this.pools.unshift(pool)
    return pool
  }
}

export enum PoolState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function usePools(
  poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][]
): [PoolState, Pool | null][] {
  const { chainId } = useWeb3React()

  const poolTokens: ([Token, Token, FeeAmount] | undefined)[] = useMemo(() => {
    if (!chainId) return new Array(poolKeys.length)

    return poolKeys.map(([currencyA, currencyB, feeAmount]) => {
      if (currencyA && currencyB && feeAmount) {
        const tokenA = currencyA.wrapped
        const tokenB = currencyB.wrapped
        if (tokenA.equals(tokenB)) return undefined

        return tokenA.sortsBefore(tokenB) ? [tokenA, tokenB, feeAmount] : [tokenB, tokenA, feeAmount]
      }
      return undefined
    })
  }, [chainId, poolKeys])

  const poolAddresses: (string | undefined)[] = useMemo(() => {
    const v3CoreFactoryAddress = chainId && V3_CORE_FACTORY_ADDRESSES[chainId]
    if (!v3CoreFactoryAddress) return new Array(poolTokens.length)

    return poolTokens.map((value) => value && PoolCache.getPoolAddress(v3CoreFactoryAddress, ...value))
  }, [chainId, poolTokens])

  const slot0s = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'slot0')
  const liquidities = useMultipleContractSingleData(poolAddresses, POOL_STATE_INTERFACE, 'liquidity')

  return useMemo(() => {
    return poolKeys.map((_key, index) => {
      const tokens = poolTokens[index]
      if (!tokens) return [PoolState.INVALID, null]
      const [token0, token1, fee] = tokens

      if (!slot0s[index]) return [PoolState.INVALID, null]
      const { result: slot0, loading: slot0Loading, valid: slot0Valid } = slot0s[index]

      if (!liquidities[index]) return [PoolState.INVALID, null]
      const { result: liquidity, loading: liquidityLoading, valid: liquidityValid } = liquidities[index]

      if (!tokens || !slot0Valid || !liquidityValid) return [PoolState.INVALID, null]
      if (slot0Loading || liquidityLoading) return [PoolState.LOADING, null]
      if (!slot0 || !liquidity) return [PoolState.NOT_EXISTS, null]
      if (!slot0.sqrtPriceX96 || slot0.sqrtPriceX96.eq(0)) return [PoolState.NOT_EXISTS, null]

      try {
        const pool = PoolCache.getPool(token0, token1, fee, slot0.sqrtPriceX96, liquidity[0], slot0.tick)
        return [PoolState.EXISTS, pool]
      } catch (error) {
        console.error('Error when constructing the pool', error)
        return [PoolState.NOT_EXISTS, null]
      }
    })
  }, [liquidities, poolKeys, slot0s, poolTokens])
}

export function usePool(
  currencyA: Currency | undefined,
  currencyB: Currency | undefined,
  feeAmount: FeeAmount | undefined
): [PoolState, Pool | null] {
  const poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][] = useMemo(
    () => [[currencyA, currencyB, feeAmount]],
    [currencyA, currencyB, feeAmount]
  )

  return usePools(poolKeys)[0]
}

export function useTokensPriceInETH(
  chainId: number | undefined,
  poolKeys: [Currency | undefined, Currency | undefined, FeeAmount | undefined][]
): [Token, number][] | undefined {
  const pools = usePools(poolKeys)

  if (chainId === undefined) return undefined
  const weth9 = WRAPPED_NATIVE_CURRENCY[chainId]

  /* 
    Remain only one pool fee which is the largest liquidity
    and filter other small liquidity pool fee
    ex)
      ETH, USDC, 0.05% fee pool = 1000 liquidity
      ETH, USDC, 0.3% fee pool = 700 liquidity
      ETH, USDC, 1% fee pool = 500 liquidity
      => remain only ETH, USDC, 1% fee pool
  */
  const bestPools: Pool[] = []

  pools.map((data, index) => {
    const poolState = data[0]
    const newPool = data[1]
    if (poolState === PoolState.EXISTS && newPool) {
      if (bestPools.length === 0) {
        // only at first, when bestPools is empty
        bestPools.push(newPool)
      } else {
        const bestPoolToken0 = bestPools[bestPools.length - 1].token0
        const bestPoolToken1 = bestPools[bestPools.length - 1].token1
        const bestPoolFee = bestPools[bestPools.length - 1].fee
        const newPooltoken0 = newPool.token0
        const newPooltoken1 = newPool.token1
        const newPoolfee = newPool.fee

        // in case of same tokens but different fee pool
        if (
          (bestPoolToken0.equals(newPooltoken0) &&
            bestPoolToken1.equals(newPooltoken1) &&
            bestPoolFee !== newPoolfee) ||
          (bestPoolToken0.equals(newPooltoken1) && bestPoolToken1.equals(newPooltoken0) && bestPoolFee !== newPoolfee)
        ) {
          const bestPoolLiquidity = bestPools[bestPools.length - 1].liquidity
          const newliquidity = newPool.liquidity

          if (JSBI.lessThan(bestPoolLiquidity, newliquidity)) {
            bestPools.pop()
            bestPools.push(newPool)
          }
        } else {
          // if new tokens pool
          bestPools.push(newPool)
        }
      }
    }
    return null
  })

  const tokenPricesInETH: [Token, number][] = []

  for (let i = 0; i < bestPools.length; i++) {
    if (bestPools[i].token0.equals(weth9)) {
      const token0Price = bestPools[i].token0Price.quote(
        CurrencyAmount.fromRawAmount(
          bestPools[i].token0,
          JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(bestPools[i].token0.decimals))
        )
      ).quotient
      const token0PriceDecimal = parseFloat(token0Price.toString()).toFixed(18)
      const ethDecimal = Math.pow(10, 18).toFixed(18)
      const token0PriceInETH = parseFloat(token0PriceDecimal) / parseFloat(ethDecimal)
      const priceInETH = parseFloat('1') / token0PriceInETH
      tokenPricesInETH.push([bestPools[i].token1, priceInETH])
    } else {
      const token1Price = bestPools[i].token1Price.quote(
        CurrencyAmount.fromRawAmount(
          bestPools[i].token1,
          JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(bestPools[i].token1.decimals))
        )
      ).quotient
      const token1PriceDecimal = parseFloat(token1Price.toString()).toFixed(18)
      const ethDecimal = Math.pow(10, 18).toFixed(18)
      const token1PriceInETH = parseFloat(token1PriceDecimal) / parseFloat(ethDecimal)
      const priceInETH = parseFloat('1') / token1PriceInETH
      tokenPricesInETH.push([bestPools[i].token0, priceInETH])
    }
  }

  return tokenPricesInETH
}

export function useETHPriceInUSD(chainId: number | undefined): number | undefined {
  const poolTokens: [Token | undefined, Token | undefined, FeeAmount | undefined][] = []
  if (chainId !== undefined) {
    poolTokens.push([WRAPPED_NATIVE_CURRENCY[chainId], USDC[chainId], FeeAmount.HIGH])
    poolTokens.push([WRAPPED_NATIVE_CURRENCY[chainId], USDC[chainId], FeeAmount.MEDIUM])
    poolTokens.push([WRAPPED_NATIVE_CURRENCY[chainId], USDC[chainId], FeeAmount.LOW])
  }

  const pools = usePools(poolTokens)
  if (chainId === undefined) return undefined
  const weth9 = WRAPPED_NATIVE_CURRENCY[chainId]

  let bestLiquidity = '0'
  let bestPool = 0

  pools.map((data, index) => {
    const poolState = data[0]
    const newPool = data[1]
    if (poolState === PoolState.EXISTS && newPool) {
      if (JSBI.GT(newPool.liquidity, JSBI.BigInt(bestLiquidity))) {
        bestLiquidity = newPool.liquidity.toString()
        bestPool = index
      }
    }
    return null
  })

  const poolState = pools[bestPool][0]
  const pool = pools[bestPool][1]
  if (poolState === PoolState.EXISTS && pool) {
    const token0 = pool.token0
    if (token0.equals(weth9)) {
      const token0Price = pool.token0Price.quote(
        CurrencyAmount.fromRawAmount(pool.token0, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(pool.token0.decimals)))
      ).quotient
      const token0PriceDecimal = parseFloat(token0Price.toString()).toFixed(18)
      const usdcDecimal = Math.pow(10, USDC[chainId].decimals).toFixed(18)
      const priceInUSD = parseFloat(token0PriceDecimal) / parseFloat(usdcDecimal)
      return priceInUSD
    } else {
      const token1Price = pool.token1Price.quote(
        CurrencyAmount.fromRawAmount(pool.token1, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(pool.token1.decimals)))
      ).quotient
      const token1PriceDecimal = parseFloat(token1Price.toString()).toFixed(18)
      const usdcDecimal = Math.pow(10, USDC[chainId].decimals).toFixed(18)
      const priceInUSD = parseFloat(token1PriceDecimal) / parseFloat(usdcDecimal)
      return priceInUSD
    }
  } else {
    return undefined
  }
}
