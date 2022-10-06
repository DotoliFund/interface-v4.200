import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useBlocksFromTimestamps } from 'hooks/useBlocksFromTimestamps'
import { useActiveNetworkVersion, useClients } from 'state/application/hooks'
import { FundData } from 'state/funds/reducer'
import { get2DayChange } from 'utils/data'
import { useDeltaTimestamps } from 'utils/queries'
import { formatTokenName, formatTokenSymbol } from 'utils/tokens'

export const FundS_BULK = (block: number | undefined, funds: string[]) => {
  let fundString = `[`
  funds.map((address) => {
    return (fundString += `"${address}",`)
  })
  fundString += ']'
  const queryString =
    `
    query funds {
      funds(where: {id_in: ${fundString}},` +
    (block ? `block: {number: ${block}} ,` : ``) +
    ` orderBy: totalValueLockedUSD, orderDirection: desc, subgraphError: allow) {
        id
        feeTier
        liquidity
        sqrtPrice
        tick
        token0 {
            id
            symbol 
            name
            decimals
            derivedETH
        }
        token1 {
            id
            symbol 
            name
            decimals
            derivedETH
        }
        token0Price
        token1Price
        volumeUSD
        volumeToken0
        volumeToken1
        txCount
        totalValueLockedToken0
        totalValueLockedToken1
        totalValueLockedUSD
      }
      bundles (where: {id: "1"}) {
        ethPriceUSD
      }
    }
    `
  return gql(queryString)
}

interface FundFields {
  id: string
  feeTier: string
  liquidity: string
  sqrtPrice: string
  tick: string
  token0: {
    id: string
    symbol: string
    name: string
    decimals: string
    derivedETH: string
  }
  token1: {
    id: string
    symbol: string
    name: string
    decimals: string
    derivedETH: string
  }
  token0Price: string
  token1Price: string
  volumeUSD: string
  volumeToken0: string
  volumeToken1: string
  txCount: string
  totalValueLockedToken0: string
  totalValueLockedToken1: string
  totalValueLockedUSD: string
}

interface FundDataResponse {
  funds: FundFields[]
  bundles: {
    ethPriceUSD: string
  }[]
}

/**
 * Fetch top addresses by volume
 */
export function useFundDatas(fundAddresses: string[]): {
  loading: boolean
  error: boolean
  data:
    | {
        [address: string]: FundData
      }
    | undefined
} {
  // get client
  const { dataClient } = useClients()
  const [activeNetwork] = useActiveNetworkVersion()

  // get blocks from historic timestamps
  const [t24, t48, tWeek] = useDeltaTimestamps()
  const { blocks, error: blockError } = useBlocksFromTimestamps([t24, t48, tWeek])
  const [block24, block48, blockWeek] = blocks ?? []

  const { loading, error, data } = useQuery<FundDataResponse>(FundS_BULK(undefined, fundAddresses), {
    client: dataClient,
  })

  const {
    loading: loading24,
    error: error24,
    data: data24,
  } = useQuery<FundDataResponse>(FundS_BULK(block24?.number, fundAddresses), { client: dataClient })
  const {
    loading: loading48,
    error: error48,
    data: data48,
  } = useQuery<FundDataResponse>(FundS_BULK(block48?.number, fundAddresses), { client: dataClient })
  const {
    loading: loadingWeek,
    error: errorWeek,
    data: dataWeek,
  } = useQuery<FundDataResponse>(FundS_BULK(blockWeek?.number, fundAddresses), { client: dataClient })

  const anyError = Boolean(error || error24 || error48 || blockError || errorWeek)
  const anyLoading = Boolean(loading || loading24 || loading48 || loadingWeek)

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: undefined,
    }
  }

  const ethPriceUSD = data?.bundles?.[0]?.ethPriceUSD ? parseFloat(data?.bundles?.[0]?.ethPriceUSD) : 0

  const parsed = data?.funds
    ? data.funds.reduce((accum: { [address: string]: FundFields }, fundData) => {
        accum[fundData.id] = fundData
        return accum
      }, {})
    : {}
  const parsed24 = data24?.funds
    ? data24.funds.reduce((accum: { [address: string]: FundFields }, fundData) => {
        accum[fundData.id] = fundData
        return accum
      }, {})
    : {}
  const parsed48 = data48?.funds
    ? data48.funds.reduce((accum: { [address: string]: FundFields }, fundData) => {
        accum[fundData.id] = fundData
        return accum
      }, {})
    : {}
  const parsedWeek = dataWeek?.funds
    ? dataWeek.funds.reduce((accum: { [address: string]: FundFields }, fundData) => {
        accum[fundData.id] = fundData
        return accum
      }, {})
    : {}

  // format data and calculate daily changes
  const formatted = fundAddresses.reduce((accum: { [address: string]: FundData }, address) => {
    const current: FundFields | undefined = parsed[address]
    const oneDay: FundFields | undefined = parsed24[address]
    const twoDay: FundFields | undefined = parsed48[address]
    const week: FundFields | undefined = parsedWeek[address]

    const [volumeUSD, volumeUSDChange] =
      current && oneDay && twoDay
        ? get2DayChange(current.volumeUSD, oneDay.volumeUSD, twoDay.volumeUSD)
        : current
        ? [parseFloat(current.volumeUSD), 0]
        : [0, 0]

    const volumeUSDWeek =
      current && week
        ? parseFloat(current.volumeUSD) - parseFloat(week.volumeUSD)
        : current
        ? parseFloat(current.volumeUSD)
        : 0

    // Hotifx: Subtract fees from TVL to correct data while subgraph is fixed.
    /**
     * Note: see issue desribed here https://github.com/Uniswap/v3-subgraph/issues/74
     * During subgraph deploy switch this month we lost logic to fix this accounting.
     * Grafted sync pending fix now.
     */
    const feePercent = current ? parseFloat(current.feeTier) / 10000 / 100 : 0
    const tvlAdjust0 = current?.volumeToken0 ? (parseFloat(current.volumeToken0) * feePercent) / 2 : 0
    const tvlAdjust1 = current?.volumeToken1 ? (parseFloat(current.volumeToken1) * feePercent) / 2 : 0
    const tvlToken0 = current ? parseFloat(current.totalValueLockedToken0) - tvlAdjust0 : 0
    const tvlToken1 = current ? parseFloat(current.totalValueLockedToken1) - tvlAdjust1 : 0
    let tvlUSD = current ? parseFloat(current.totalValueLockedUSD) : 0

    const tvlUSDChange =
      current && oneDay
        ? ((parseFloat(current.totalValueLockedUSD) - parseFloat(oneDay.totalValueLockedUSD)) /
            parseFloat(oneDay.totalValueLockedUSD === '0' ? '1' : oneDay.totalValueLockedUSD)) *
          100
        : 0

    // Part of TVL fix
    const tvlUpdated = current
      ? tvlToken0 * parseFloat(current.token0.derivedETH) * ethPriceUSD +
        tvlToken1 * parseFloat(current.token1.derivedETH) * ethPriceUSD
      : undefined
    if (tvlUpdated) {
      tvlUSD = tvlUpdated
    }

    const feeTier = current ? parseInt(current.feeTier) : 0

    if (current) {
      accum[address] = {
        address,
        feeTier,
        liquidity: parseFloat(current.liquidity),
        sqrtPrice: parseFloat(current.sqrtPrice),
        tick: parseFloat(current.tick),
        token0: {
          address: current.token0.id,
          name: formatTokenName(current.token0.id, current.token0.name, activeNetwork),
          symbol: formatTokenSymbol(current.token0.id, current.token0.symbol, activeNetwork),
          decimals: parseInt(current.token0.decimals),
          derivedETH: parseFloat(current.token0.derivedETH),
        },
        token1: {
          address: current.token1.id,
          name: formatTokenName(current.token1.id, current.token1.name, activeNetwork),
          symbol: formatTokenSymbol(current.token1.id, current.token1.symbol, activeNetwork),
          decimals: parseInt(current.token1.decimals),
          derivedETH: parseFloat(current.token1.derivedETH),
        },
        token0Price: parseFloat(current.token0Price),
        token1Price: parseFloat(current.token1Price),
        volumeUSD,
        volumeUSDChange,
        volumeUSDWeek,
        tvlUSD,
        tvlUSDChange,
        tvlToken0,
        tvlToken1,
      }
    }

    return accum
  }, {})

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
