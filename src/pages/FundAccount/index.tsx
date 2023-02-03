import { Interface } from '@ethersproject/abi'
import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import IERC20Metadata from '@uniswap/v3-periphery/artifacts/contracts/interfaces/IERC20Metadata.sol/IERC20Metadata.json'
import { FeeAmount, Pool, Position } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import TokenBarChart from 'components/BarChart/stacked'
import { ButtonGray, ButtonPrimary, ButtonText } from 'components/Button'
import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import ComposedChart from 'components/ComposedChart'
import { LoadingRows } from 'components/Loader/styled'
import { FlyoutAlignment, NewMenu } from 'components/Menu'
import Percent from 'components/Percent'
import PieChart from 'components/PieChart'
import PositionList from 'components/PositionList'
import { AutoRow, RowBetween, RowFixed, RowFlat } from 'components/Row'
import { MonoSpace } from 'components/shared'
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
import TransactionTable from 'components/TransactionsTable'
import LiquidityTransactionTable from 'components/TransactionsTable/LiquidityTransactionTable'
import { EthereumNetworkInfo } from 'constants/networks'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useInvestorChartData } from 'data/FundAccount/chartData'
import { useInvestorData } from 'data/FundAccount/investorData'
import { useFundAccountLiquidityTransactions } from 'data/FundAccount/liquidityTransactions'
import { useFundAccountTransactions } from 'data/FundAccount/transactions'
import { useColor } from 'hooks/useColor'
import { useDotoliFactoryContract } from 'hooks/useContract'
import { useETHPriceInUSD, usePools } from 'hooks/usePools'
import { useTokensPriceInUSD } from 'hooks/useTokensPriceInUSD'
import { useV3Positions } from 'hooks/useV3Positions'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ChevronDown, Inbox, PlusCircle } from 'react-feather'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useUserHideClosedPositions } from 'state/user/hooks'
import styled, { css, useTheme } from 'styled-components/macro'
import { StyledInternalLink, ThemedText } from 'theme'
import { PositionDetails } from 'types/position'
import { IERC20MetadataInterface } from 'types/v3/v3-periphery/artifacts/contracts/interfaces/IERC20Metadata'
import { shortenAddress } from 'utils'
import { formatTime, unixToDate } from 'utils/date'
import { networkPrefix } from 'utils/networkPrefix'
import { formatAmount, formatDollarAmount } from 'utils/numbers'

const PageWrapper = styled.div`
  width: 90%;
`

const ThemedBackground = styled.div<{ backgroundColor: string }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
  max-width: 100vw !important;
  height: 200vh;
  mix-blend-mode: color;
  background: ${({ backgroundColor }) =>
    `radial-gradient(50% 50% at 50% 50%, ${backgroundColor} 0%, rgba(255, 255, 255, 0) 100%)`};
  transform: translateY(-176vh);
`

const ContentLayout = styled.div`
  display: grid;
  grid-template-columns: 360px 1fr;
  grid-gap: 1em;

  @media screen and (max-width: 800px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
`

const ResponsiveRow = styled(RowBetween)`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    align-items: flex-start;
    row-gap: 24px;
    width: 100%:
  `};
`

const ToggleRow = styled(RowFlat)`
  justify-content: flex-end;
  margin-bottom: 10px;

  @media screen and (max-width: 600px) {
    flex-direction: row;
  }
`

const MoreOptionsButton = styled(ButtonGray)`
  border-radius: 12px;
  flex: 1 1 auto;
  padding: 6px 8px;
  width: 100%;
  background-color: ${({ theme }) => theme.deprecated_bg0};
  margin-right: 8px;
`

const MoreOptionsText = styled(ThemedText.DeprecatedBody)`
  align-items: center;
  display: flex;
`

const Menu = styled(NewMenu)`
  margin-left: 0;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex: 1 1 auto;
    width: 49%;
    right: 0px;
  `};

  a {
    width: 100%;
  }
`

const MenuItem = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-weight: 500;
`

const TitleRow = styled(RowBetween)`
  color: ${({ theme }) => theme.deprecated_text2};
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  `};
`

const ButtonRow = styled(RowFixed)`
  & > *:not(:last-child) {
    margin-left: 8px;
  }
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    flex-direction: row-reverse;
  `};
`

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`

const InboxIcon = styled(Inbox)`
  ${IconStyle}
`

const ErrorContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  max-width: 300px;
  min-height: 25vh;
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  border-radius: 12px;
  padding: 6px 8px;
  width: fit-content;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex: 1 1 auto;
    width: 100%;
  `};
`

const MainContentWrapper = styled.main`
  background-color: ${({ theme }) => theme.deprecated_bg0};
  padding: 8px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
`

enum ChartView {
  VOL_USD,
  TOKENS,
}

const ERC20_METADATA_INTERFACE = new Interface(IERC20Metadata.abi) as IERC20MetadataInterface

function PositionsLoadingPlaceholder() {
  return (
    <LoadingRows>
      <div style={{ height: '250px' }} />
    </LoadingRows>
  )
}

export default function FundAccount() {
  const params = useParams()
  const fundAddress = params.fundAddress
  const investorAddress = params.investorAddress
  const newPositionLink = '/add/' + fundAddress + '/' + investorAddress + '/ETH'
  const navigate = useNavigate()
  const DotoliFactoryContract = useDotoliFactoryContract()
  const [activeNetwork] = useActiveNetworkVersion()
  const { chainId, account } = useWeb3React()
  const [userHideClosedPositions, setUserHideClosedPositions] = useUserHideClosedPositions()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // theming
  const backgroundColor = useColor()
  const theme = useTheme()

  const { loading: accountManagingFundLoading, result: [accountManagingFund] = [] } = useSingleCallResult(
    DotoliFactoryContract,
    'getFundByManager',
    [account ?? undefined]
  )
  const { loading: investorManagingFundLoading, result: [investorManagingFund] = [] } = useSingleCallResult(
    DotoliFactoryContract,
    'getFundByManager',
    [investorAddress ?? undefined]
  )
  const { loading: isAccountSubscribedLoading, result: [isAccountSubscribed] = [] } = useSingleCallResult(
    DotoliFactoryContract,
    'isSubscribed',
    [account, fundAddress]
  )

  const [accountIsManager, setAccountIsManager] = useState<boolean>(false)
  useEffect(() => {
    if (!accountManagingFundLoading) {
      setState()
    }
    async function setState() {
      if (accountManagingFund && fundAddress && accountManagingFund.toUpperCase() === fundAddress.toUpperCase()) {
        setAccountIsManager(true)
      } else {
        setAccountIsManager(false)
      }
    }
  }, [accountManagingFundLoading, accountManagingFund, fundAddress, account])

  const [accountIsInvestor, setAccountIsInvestor] = useState<boolean>(false)
  useEffect(() => {
    if (!isAccountSubscribedLoading) {
      setState()
    }
    async function setState() {
      if (
        accountManagingFund &&
        fundAddress &&
        accountManagingFund.toUpperCase() !== fundAddress.toUpperCase() &&
        isAccountSubscribed
      ) {
        setAccountIsInvestor(true)
      } else {
        setAccountIsInvestor(false)
      }
    }
  }, [accountManagingFund, fundAddress, isAccountSubscribedLoading, isAccountSubscribed])

  const [accountIsFundAccount, setAccountIsFundAccount] = useState<boolean>(false)
  useEffect(() => {
    if (!isAccountSubscribedLoading) {
      setState()
    }
    async function setState() {
      if (
        account &&
        investorAddress &&
        account.toUpperCase() === investorAddress.toUpperCase() &&
        isAccountSubscribed
      ) {
        setAccountIsFundAccount(true)
      } else {
        setAccountIsFundAccount(false)
      }
    }
  }, [account, investorAddress, isAccountSubscribedLoading, isAccountSubscribed])

  const [fundAccountIsManager, setFundAccountIsManager] = useState<boolean>(false)
  useEffect(() => {
    if (!investorManagingFundLoading) {
      setState()
    }
    async function setState() {
      if (investorManagingFund && fundAddress && investorManagingFund.toUpperCase() === fundAddress.toUpperCase()) {
        setFundAccountIsManager(true)
      } else {
        setFundAccountIsManager(false)
      }
    }
  }, [investorManagingFundLoading, investorManagingFund, fundAddress, investorAddress])

  const [fundAccountIsNotManager, setFundAccountIsNotManager] = useState<boolean>(false)
  useEffect(() => {
    if (!investorManagingFundLoading) {
      setState()
    }
    async function setState() {
      if (investorManagingFund && fundAddress && investorManagingFund.toUpperCase() !== fundAddress.toUpperCase()) {
        setFundAccountIsNotManager(true)
      } else {
        setFundAccountIsNotManager(false)
      }
    }
  }, [investorManagingFund, fundAddress, investorManagingFundLoading])

  const investorData = useInvestorData(fundAddress, investorAddress).data
  const chartData = useInvestorChartData(fundAddress, investorAddress).data
  const transactions = useFundAccountTransactions(fundAddress, investorAddress).data
  const liquidityTransactions = useFundAccountLiquidityTransactions(fundAddress, investorAddress).data

  const [view, setView] = useState(ChartView.VOL_USD)

  // chart hover index
  const [volumeIndexHover, setVolumeIndexHover] = useState<number | undefined>()
  const [tokenIndexHover, setTokenIndexHover] = useState<number | undefined>()
  const [feeIndexHover, setFeeIndexHover] = useState<number | undefined>()

  const { positions, loading: positionsLoading } = useV3Positions(fundAddress, investorAddress)
  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.liquidity?.isZero() ? 1 : 0].push(p)
      return acc
    },
    [[], []]
  ) ?? [[], []]

  const filteredPositions = [...openPositions, ...(userHideClosedPositions ? [] : closedPositions)]

  const formattedVolumeUSD = useMemo(() => {
    if (chartData) {
      return chartData.map((data, index) => {
        return {
          time: data.timestamp,
          current: data.currentUSD,
          pool: data.poolUSD,
          invest: data.investAmountUSD,
          tokens: data.tokens,
          symbols: data.tokensSymbols,
          tokensVolume: data.tokensAmountUSD,
          index,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const poolTokens = useMemo(() => {
    if (chainId && openPositions && openPositions.length > 0) {
      const tokens: string[] = []
      for (let i = 0; i < openPositions.length; i++) {
        const token0 = openPositions[i].token0
        const token1 = openPositions[i].token1

        if (!tokens.includes(token0)) {
          tokens.push(token0)
        }
        if (!tokens.includes(token1)) {
          tokens.push(token1)
        }
      }
      return tokens
    } else {
      return []
    }
  }, [chainId, openPositions])

  if (chainId && openPositions && openPositions.length > 0 && investorData) {
    for (let i = 0; i < openPositions.length; i++) {
      const token0 = openPositions[i].token0
      const token1 = openPositions[i].token1

      if (!poolTokens.includes(token0)) {
        poolTokens.push(token0)
      }
      if (!poolTokens.includes(token1)) {
        poolTokens.push(token1)
      }
    }
  }

  const poolTokensSymbolInfo = useMultipleContractSingleData(poolTokens, ERC20_METADATA_INTERFACE, 'symbol')
  const poolTokensSymbols = useMemo(() => {
    const symbols: string[] = []
    for (let i = 0; i < poolTokensSymbolInfo.length; i++) {
      const symbol = poolTokensSymbolInfo[i].result
      if (symbol) {
        symbols.push(symbol.toString())
      } else {
        symbols.push('Unknown')
      }
    }
    return symbols
  }, [poolTokensSymbolInfo])

  const poolTokensDecimalsInfo = useMultipleContractSingleData(poolTokens, ERC20_METADATA_INTERFACE, 'decimals')
  const poolTokensDecimals = useMemo(() => {
    const decimals: number[] = []
    for (let i = 0; i < poolTokensDecimalsInfo.length; i++) {
      const decimal = poolTokensDecimalsInfo[i].result
      if (decimal) {
        decimals.push(Number(decimal))
      } else {
        decimals.push(18)
      }
    }
    return decimals
  }, [poolTokensDecimalsInfo])

  const positionTokens: [Token | undefined, Token | undefined, FeeAmount | undefined][] = useMemo(() => {
    if (chainId && openPositions && openPositions.length > 0 && investorData) {
      return openPositions.map((data, index) => {
        const token0: string = data.token0
        const token1: string = data.token1
        const fee = data.fee

        let token0Symbol = ''
        let token1Symbol = ''
        let token0Decimals = 0
        let token1Decimals = 0
        poolTokens.map((token, index) => {
          if (token.toUpperCase() === token0.toUpperCase()) {
            token0Symbol = poolTokensSymbols[index]
            token0Decimals = poolTokensDecimals[index]
          } else if (token.toUpperCase() === token1.toUpperCase()) {
            token1Symbol = poolTokensSymbols[index]
            token1Decimals = poolTokensDecimals[index]
          }
        })

        return [
          new Token(chainId, token0, token0Decimals, token0Symbol),
          new Token(chainId, token1, token1Decimals, token1Symbol),
          fee,
        ]
      })
    } else {
      return []
    }
  }, [chainId, investorData, openPositions, poolTokens, poolTokensSymbols, poolTokensDecimals])

  const positionPools = usePools(positionTokens)

  const poolPositions: Position[] = []
  if (openPositions && openPositions.length > 0 && positionPools && positionPools.length > 0) {
    for (let i = 0; i < openPositions.length; i++) {
      const liquidity = openPositions[i].liquidity
      const tickLower = openPositions[i].tickLower
      const tickUpper = openPositions[i].tickUpper
      const pool: Pool | null = positionPools[i][1]

      if (pool && liquidity) {
        poolPositions.push(new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper }))
      }
    }
  }

  const currentTokensData = useMemo(() => {
    if (investorData) {
      return investorData.currentTokens.map((data, index) => {
        return {
          token: data,
          symbol: investorData.currentTokensSymbols[index],
          decimal: investorData.currentTokensDecimals[index],
          amount: investorData.currentTokensAmount[index],
        }
      })
    } else {
      return []
    }
  }, [investorData])

  const poolTokensData = []
  if (poolPositions) {
    for (let i = 0; i < poolPositions.length; i++) {
      const token0 = poolPositions[i].pool.token0.address
      const token0Symbol = poolPositions[i].pool.token0.symbol
      const token0Decimal = poolPositions[i].pool.token0.decimals
      const token0Amount = parseFloat(poolPositions[i].amount0.quotient.toString())
      const token0AmountDecimal = Number(token0Amount / parseFloat((10 ** token0Decimal).toString()))

      const token1 = poolPositions[i].pool.token1.address
      const token1Symbol = poolPositions[i].pool.token1.symbol
      const token1Decimal = poolPositions[i].pool.token1.decimals
      const token1Amount = Number(poolPositions[i].amount1.quotient.toString())
      const token1AmountDecimal = Number(token1Amount / parseFloat((10 ** token1Decimal).toString()))

      if (token0Symbol && token1Symbol) {
        poolTokensData.push({
          token: token0,
          symbol: token0Symbol,
          decimal: token0Decimal,
          amount: token0AmountDecimal,
        })
        poolTokensData.push({
          token: token1,
          symbol: token1Symbol,
          decimal: token1Decimal,
          amount: token1AmountDecimal,
        })
      }
    }
  }

  const weth9 = chainId ? WRAPPED_NATIVE_CURRENCY[chainId] : undefined
  const ethPriceInUSDC = useETHPriceInUSD(chainId)
  const currentTokensAmountUSD = useTokensPriceInUSD(chainId, weth9, ethPriceInUSDC, currentTokensData)
  const DuplicatedPoolTokensAmountUSD = useTokensPriceInUSD(chainId, weth9, ethPriceInUSDC, poolTokensData)
  const poolTokensAmountUSD = useMemo(() => {
    const tokensAmountUSD: [Token, number, number][] = []
    if (DuplicatedPoolTokensAmountUSD) {
      for (let i = 0; i < DuplicatedPoolTokensAmountUSD.length; i++) {
        const token = DuplicatedPoolTokensAmountUSD[i][0]
        const amount = DuplicatedPoolTokensAmountUSD[i][1]
        const amountUSD = DuplicatedPoolTokensAmountUSD[i][2]
        let isNew = true
        for (let j = 0; j < tokensAmountUSD.length; j++) {
          const _token = tokensAmountUSD[j][0]
          if (token.address.toUpperCase() === _token.address.toUpperCase()) {
            tokensAmountUSD[j][1] += amount
            tokensAmountUSD[j][2] += amountUSD
            isNew = false
            break
          }
        }
        if (isNew) {
          tokensAmountUSD.push([token, amount, amountUSD])
        }
      }
    }
    return tokensAmountUSD
  }, [DuplicatedPoolTokensAmountUSD])

  const formattedLatestTokens = useMemo(() => {
    if (currentTokensAmountUSD && poolTokensAmountUSD) {
      // 1. get current tokens
      const tokensData = currentTokensAmountUSD.map((data, index) => {
        const token = data[0].address
        const symbol = data[0].symbol ? data[0].symbol : 'Unknown'
        const decimal = data[0].decimals
        const currentAmount = data[1]
        const currentAmountUSD = data[2]
        return {
          token,
          symbol,
          decimal,
          currentAmount,
          current: currentAmountUSD,
          poolAmount: 0,
          pool: 0, //poolAmountUSD
          index,
        }
      })

      // 2. get pool tokens
      poolTokensAmountUSD.map((data, index) => {
        const token = data[0].address
        const symbol = data[0].symbol ? data[0].symbol : 'Unknown'
        const decimal = data[0].decimals
        const poolAmount = data[1]
        const poolAmountUSD = data[2]
        let added = false
        for (let i = 0; i < tokensData.length; i++) {
          if (token.toUpperCase() === tokensData[i].token.toUpperCase()) {
            tokensData[i].poolAmount = tokensData[i].poolAmount + poolAmount
            tokensData[i].pool = tokensData[i].pool + poolAmountUSD
            added = true
          }
        }
        if (!added) {
          tokensData.push({
            token,
            symbol,
            decimal,
            currentAmount: 0,
            current: 0, //currentAmountUSD
            poolAmount,
            pool: poolAmountUSD,
            index,
          })
        }
      })
      return tokensData
    } else {
      return []
    }
  }, [currentTokensAmountUSD, poolTokensAmountUSD])

  if (formattedVolumeUSD && formattedVolumeUSD.length > 0 && formattedLatestTokens) {
    let totalCurrentAmountUSD = 0
    currentTokensAmountUSD.map((value, index) => {
      const tokenAmountUSD = value[2]
      totalCurrentAmountUSD += tokenAmountUSD
    })
    let totalPoolAmountUSD = 0
    poolTokensAmountUSD.map((value, index) => {
      const tokenAmountUSD = value[2]
      totalPoolAmountUSD += tokenAmountUSD
    })

    const tokens = formattedLatestTokens.map((data, index) => {
      return data.token
    })

    const symbols = formattedLatestTokens.map((data, index) => {
      return data.symbol
    })

    const tokensVolume = formattedLatestTokens.map((data, index) => {
      return data.current + data.pool
    })

    formattedVolumeUSD.push({
      time: Math.floor(new Date().getTime() / 1000),
      current: totalCurrentAmountUSD,
      pool: totalPoolAmountUSD,
      invest: formattedVolumeUSD[formattedVolumeUSD.length - 1].invest,
      tokens,
      symbols,
      tokensVolume,
      index: formattedVolumeUSD.length,
    })
  }

  const volumeChartHoverIndex = volumeIndexHover !== undefined ? volumeIndexHover : undefined

  const investAmountHover = useMemo(() => {
    if (volumeChartHoverIndex !== undefined && formattedVolumeUSD) {
      const volumeUSDData = formattedVolumeUSD[volumeChartHoverIndex]
      return volumeUSDData.invest
    } else if (formattedVolumeUSD.length > 0) {
      return formattedVolumeUSD[formattedVolumeUSD.length - 1].invest
    } else {
      return undefined
    }
  }, [volumeChartHoverIndex, formattedVolumeUSD])

  const tokenHover = useMemo(() => {
    if (volumeChartHoverIndex !== undefined && formattedVolumeUSD) {
      const volumeUSDData = formattedVolumeUSD[volumeChartHoverIndex]
      const tokens = volumeUSDData.tokens
      return tokens.map((data: any, index: any) => {
        return {
          token: data,
          symbol: volumeUSDData.symbols[index],
          volume: volumeUSDData.tokensVolume[index],
        }
      })
    } else {
      if (formattedLatestTokens) {
        return formattedLatestTokens.map((data, index) => {
          return {
            token: data.token,
            symbol: data.symbol,
            volume: data.current + data.pool,
          }
        })
      } else {
        return []
      }
    }
  }, [volumeChartHoverIndex, formattedVolumeUSD, formattedLatestTokens])

  const ratio = useMemo(() => {
    return volumeChartHoverIndex !== undefined && formattedVolumeUSD[volumeChartHoverIndex].invest > 0
      ? Number(
          (
            ((formattedVolumeUSD[volumeChartHoverIndex].current +
              formattedVolumeUSD[volumeChartHoverIndex].pool -
              formattedVolumeUSD[volumeChartHoverIndex].invest) /
              formattedVolumeUSD[volumeChartHoverIndex].invest) *
            100
          ).toFixed(2)
        )
      : volumeChartHoverIndex !== undefined && formattedVolumeUSD[volumeChartHoverIndex].invest === 0
      ? Number(0)
      : formattedVolumeUSD && formattedVolumeUSD.length > 0
      ? Number(
          (
            ((formattedVolumeUSD[formattedVolumeUSD.length - 1].current +
              formattedVolumeUSD[formattedVolumeUSD.length - 1].pool -
              formattedVolumeUSD[formattedVolumeUSD.length - 1].invest) /
              formattedVolumeUSD[formattedVolumeUSD.length - 1].invest) *
            100
          ).toFixed(2)
        )
      : Number(0)
  }, [volumeChartHoverIndex, formattedVolumeUSD])

  const menuItems1 = [
    {
      content: (
        <MenuItem>
          <Trans>Deposit</Trans>
          <PlusCircle size={16} />
        </MenuItem>
      ),
      link: `/deposit/${fundAddress}/${investorAddress}`,
      external: false,
    },
    {
      content: (
        <MenuItem>
          <Trans>Withdraw</Trans>
          <BookOpen size={16} />
        </MenuItem>
      ),
      link: `/withdraw/${fundAddress}/${investorAddress}`,
      external: false,
    },
  ]

  const menuItems2 = [
    {
      content: (
        <MenuItem>
          <Trans>Withdraw</Trans>
          <PlusCircle size={16} />
        </MenuItem>
      ),
      link: `/withdraw/${fundAddress}/${investorAddress}`,
      external: false,
    },
  ]

  const Buttons = () =>
    !account ? (
      <ButtonPrimary $borderRadius="12px" mr="12px" padding={'12px'}>
        <ThemedText.DeprecatedMain mb="4px">
          <Trans>Connect Wallet</Trans>
        </ThemedText.DeprecatedMain>
      </ButtonPrimary>
    ) : accountIsManager && fundAccountIsManager ? (
      <>
        <ButtonPrimary
          $borderRadius="12px"
          mr="12px"
          padding={'12px'}
          onClick={() => {
            navigate(`/swap/${fundAddress}/${investorAddress}`)
          }}
        >
          <ThemedText.DeprecatedMain mb="4px">
            <Trans>Swap</Trans>
          </ThemedText.DeprecatedMain>
        </ButtonPrimary>
        <Menu
          menuItems={menuItems1}
          flyoutAlignment={FlyoutAlignment.LEFT}
          ToggleUI={(props: any) => (
            <MoreOptionsButton {...props}>
              <MoreOptionsText>
                <Trans>More</Trans>
                <ChevronDown size={15} />
              </MoreOptionsText>
            </MoreOptionsButton>
          )}
        />
      </>
    ) : accountIsManager && fundAccountIsNotManager ? (
      <>
        <ButtonPrimary
          $borderRadius="12px"
          mr="12px"
          padding={'12px'}
          onClick={() => {
            navigate(`/swap/${fundAddress}/${investorAddress}`)
          }}
        >
          <ThemedText.DeprecatedMain mb="4px">
            <Trans>Swap</Trans>
          </ThemedText.DeprecatedMain>
        </ButtonPrimary>
      </>
    ) : accountIsInvestor && fundAccountIsNotManager && accountIsFundAccount ? (
      <>
        <ButtonPrimary
          $borderRadius="12px"
          mr="12px"
          padding={'12px'}
          onClick={() => {
            navigate(`/deposit/${fundAddress}/${investorAddress}`)
          }}
        >
          <ThemedText.DeprecatedMain mb="4px">
            <Trans>Deposit</Trans>
          </ThemedText.DeprecatedMain>
        </ButtonPrimary>
        <Menu
          menuItems={menuItems2}
          flyoutAlignment={FlyoutAlignment.LEFT}
          ToggleUI={(props: any) => (
            <MoreOptionsButton {...props}>
              <MoreOptionsText>
                <Trans>More</Trans>
                <ChevronDown size={15} />
              </MoreOptionsText>
            </MoreOptionsButton>
          )}
        />
      </>
    ) : null

  return (
    <PageWrapper>
      <ThemedBackground backgroundColor={backgroundColor} />
      {investorData ? (
        <AutoColumn gap="16px">
          <RowBetween>
            <AutoRow gap="4px">
              <StyledInternalLink to={networkPrefix(activeNetwork)}>
                <ThemedText.DeprecatedMain>{`Home > `}</ThemedText.DeprecatedMain>
              </StyledInternalLink>
              <StyledInternalLink to={networkPrefix(activeNetwork) + 'funds'}>
                <ThemedText.DeprecatedLabel>{` Funds `}</ThemedText.DeprecatedLabel>
              </StyledInternalLink>
              <ThemedText.DeprecatedMain>{` > `}</ThemedText.DeprecatedMain>
              <StyledInternalLink to={networkPrefix(activeNetwork) + 'fund/' + investorData.fund}>
                <ThemedText.DeprecatedLabel>{`${shortenAddress(investorData.fund)}`}</ThemedText.DeprecatedLabel>
              </StyledInternalLink>
              <ThemedText.DeprecatedMain>{` > `}</ThemedText.DeprecatedMain>
              <StyledInternalLink
                to={networkPrefix(activeNetwork) + 'fund/' + investorData.fund + '/' + investorData.investor}
              >
                <ThemedText.DeprecatedLabel>{`${shortenAddress(investorData.investor)}`}</ThemedText.DeprecatedLabel>
              </StyledInternalLink>
            </AutoRow>
          </RowBetween>
          <ResponsiveRow align="flex-end">
            <ThemedText.DeprecatedLabel ml="8px" mr="8px" fontSize="24px">{`Investor : ${shortenAddress(
              investorData.investor
            )}`}</ThemedText.DeprecatedLabel>
            {activeNetwork === EthereumNetworkInfo ? null : <></>}

            {activeNetwork !== EthereumNetworkInfo ? null : (
              <RowFixed>
                <Buttons />
              </RowFixed>
            )}
          </ResponsiveRow>
          <ContentLayout>
            <DarkGreyCard>
              <AutoColumn gap="md">
                <AutoRow gap="md">
                  <ThemedText.DeprecatedMain ml="8px">Manager : </ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="14px" ml="8px">
                    {shortenAddress(investorData.manager)}
                  </ThemedText.DeprecatedLabel>
                </AutoRow>
                <PieChart data={tokenHover} color={activeNetwork.primaryColor} />
              </AutoColumn>
            </DarkGreyCard>
            <DarkGreyCard>
              <ToggleRow>
                <ToggleWrapper width="240px">
                  <ToggleElement
                    isActive={view === ChartView.VOL_USD}
                    fontSize="12px"
                    onClick={() => (view === ChartView.VOL_USD ? {} : setView(ChartView.VOL_USD))}
                  >
                    Volume
                  </ToggleElement>
                  <ToggleElement
                    isActive={view === ChartView.TOKENS}
                    fontSize="12px"
                    onClick={() => (view === ChartView.TOKENS ? {} : setView(ChartView.TOKENS))}
                  >
                    Tokens
                  </ToggleElement>
                </ToggleWrapper>
              </ToggleRow>
              {view === ChartView.VOL_USD ? (
                <ComposedChart
                  data={formattedVolumeUSD}
                  color={activeNetwork.primaryColor}
                  setIndex={setVolumeIndexHover}
                  topLeft={
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        <MonoSpace>
                          {formatDollarAmount(
                            volumeIndexHover !== undefined && formattedVolumeUSD && formattedVolumeUSD.length > 0
                              ? formattedVolumeUSD[volumeIndexHover].current + formattedVolumeUSD[volumeIndexHover].pool
                              : formattedVolumeUSD && formattedVolumeUSD.length > 0
                              ? formattedVolumeUSD[formattedVolumeUSD.length - 1].current +
                                formattedVolumeUSD[formattedVolumeUSD.length - 1].pool
                              : 0
                          )}
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
                      <ThemedText.DeprecatedMediumHeader fontSize="16px">
                        <Percent value={ratio} wrap={false} fontSize="22px" />
                      </ThemedText.DeprecatedMediumHeader>
                    </AutoColumn>
                  }
                  topRight={
                    <AutoColumn gap="4px" justify="end">
                      <AutoRow justify="end">
                        <ThemedText.DeprecatedMediumHeader fontSize="18px" color={'#ff1a75'}>
                          <MonoSpace>
                            {formatDollarAmount(
                              volumeIndexHover !== undefined
                                ? formattedVolumeUSD[volumeIndexHover].current
                                : formattedVolumeUSD && formattedVolumeUSD.length > 0
                                ? formattedVolumeUSD[formattedVolumeUSD.length - 1].current
                                : 0
                            )}
                          </MonoSpace>
                        </ThemedText.DeprecatedMediumHeader>
                        &nbsp;&nbsp;
                        <ThemedText.DeprecatedMediumHeader fontSize="18px" color={'#3377ff'}>
                          <MonoSpace>
                            {formatDollarAmount(
                              volumeIndexHover !== undefined
                                ? formattedVolumeUSD[volumeIndexHover].pool
                                : formattedVolumeUSD && formattedVolumeUSD.length > 0
                                ? formattedVolumeUSD[formattedVolumeUSD.length - 1].pool
                                : 0
                            )}
                          </MonoSpace>
                        </ThemedText.DeprecatedMediumHeader>
                        &nbsp;&nbsp;
                        <ThemedText.DeprecatedMediumHeader fontSize="18px" color={'#99FF99'}>
                          <MonoSpace>
                            {formatDollarAmount(
                              investAmountHover !== undefined
                                ? investAmountHover
                                : formattedVolumeUSD && formattedVolumeUSD.length > 0
                                ? formattedVolumeUSD[formattedVolumeUSD.length - 1].invest
                                : 0
                            )}
                          </MonoSpace>
                        </ThemedText.DeprecatedMediumHeader>
                      </AutoRow>
                      <ThemedText.DeprecatedMain fontSize="14px" height="14px" mb={'30px'}>
                        {volumeIndexHover !== undefined ? (
                          <MonoSpace>
                            {unixToDate(Number(formattedVolumeUSD[volumeIndexHover].time))} (
                            {formatTime(formattedVolumeUSD[volumeIndexHover].time.toString(), 8)})
                          </MonoSpace>
                        ) : formattedVolumeUSD && formattedVolumeUSD.length > 0 ? (
                          <MonoSpace>
                            {unixToDate(formattedVolumeUSD[formattedVolumeUSD.length - 1].time)} (
                            {formatTime(formattedVolumeUSD[formattedVolumeUSD.length - 1].time.toString(), 8)})
                          </MonoSpace>
                        ) : null}
                      </ThemedText.DeprecatedMain>
                    </AutoColumn>
                  }
                />
              ) : view === ChartView.TOKENS ? (
                <TokenBarChart
                  data={formattedLatestTokens}
                  color={activeNetwork.primaryColor}
                  setIndex={setTokenIndexHover}
                  topLeft={
                    <AutoColumn gap="4px">
                      <AutoRow>
                        <ThemedText.DeprecatedMediumHeader fontSize="18px">
                          {tokenIndexHover !== undefined ? formattedLatestTokens[tokenIndexHover].symbol : null}
                          &nbsp;&nbsp;
                        </ThemedText.DeprecatedMediumHeader>
                        {tokenIndexHover !== undefined ? (
                          <ThemedText.DeprecatedMain fontSize="14px">
                            <Link to={'https://www.guru99.com/c-function-pointers.html'}>
                              <MonoSpace>{shortenAddress(formattedLatestTokens[tokenIndexHover].token)}</MonoSpace>
                            </Link>
                          </ThemedText.DeprecatedMain>
                        ) : null}
                      </AutoRow>
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        {tokenIndexHover !== undefined ? (
                          <MonoSpace>
                            {formatDollarAmount(
                              formattedLatestTokens[tokenIndexHover].current +
                                formattedLatestTokens[tokenIndexHover].pool
                            )}
                          </MonoSpace>
                        ) : (
                          <>
                            <br />
                          </>
                        )}
                      </ThemedText.DeprecatedLargeHeader>
                    </AutoColumn>
                  }
                  topRight={
                    <AutoColumn gap="4px">
                      <AutoRow justify="end">
                        {tokenIndexHover !== undefined ? (
                          <>
                            <ThemedText.DeprecatedMediumHeader fontSize="20px" color={'#ff1a75'}>
                              <MonoSpace>
                                {formatAmount(formattedLatestTokens[tokenIndexHover].currentAmount)}
                              </MonoSpace>
                            </ThemedText.DeprecatedMediumHeader>
                            <ThemedText.DeprecatedMain fontSize="20px">
                              <MonoSpace>
                                {' '}
                                ({formatDollarAmount(formattedLatestTokens[tokenIndexHover].current)})
                              </MonoSpace>
                            </ThemedText.DeprecatedMain>
                          </>
                        ) : null}
                      </AutoRow>
                      <AutoRow justify="end">
                        {tokenIndexHover !== undefined ? (
                          <>
                            <ThemedText.DeprecatedMediumHeader fontSize="20px" color={'#3377ff'}>
                              <MonoSpace>{formatAmount(formattedLatestTokens[tokenIndexHover].poolAmount)}</MonoSpace>
                            </ThemedText.DeprecatedMediumHeader>
                            <ThemedText.DeprecatedMain fontSize="20px">
                              <MonoSpace>
                                {' '}
                                ({formatDollarAmount(formattedLatestTokens[tokenIndexHover].pool)})
                              </MonoSpace>
                            </ThemedText.DeprecatedMain>
                          </>
                        ) : null}
                      </AutoRow>
                    </AutoColumn>
                  }
                />
              ) : null}
            </DarkGreyCard>
          </ContentLayout>
          <TitleRow mt={'16px'}>
            <ThemedText.DeprecatedMain fontSize="24px">Positions</ThemedText.DeprecatedMain>
            {accountIsManager ? (
              <ButtonRow>
                <ResponsiveButtonPrimary
                  data-cy="join-pool-button"
                  id="join-pool-button"
                  as={Link}
                  to={newPositionLink}
                >
                  + <Trans>New Position</Trans>
                </ResponsiveButtonPrimary>
              </ButtonRow>
            ) : null}
          </TitleRow>
          <MainContentWrapper>
            {positionsLoading ? (
              <PositionsLoadingPlaceholder />
            ) : filteredPositions && closedPositions && filteredPositions.length > 0 ? (
              <PositionList
                positions={filteredPositions}
                setUserHideClosedPositions={setUserHideClosedPositions}
                userHideClosedPositions={userHideClosedPositions}
              />
            ) : (
              <ErrorContainer>
                <ThemedText.DeprecatedBody color={theme.deprecated_text3} textAlign="center">
                  <InboxIcon strokeWidth={1} />
                  <div>
                    <Trans>Your active V3 liquidity positions will appear here.</Trans>
                  </div>
                </ThemedText.DeprecatedBody>
                {account && closedPositions.length > 0 && (
                  <ButtonText
                    style={{ marginTop: '.5rem' }}
                    onClick={() => setUserHideClosedPositions(!userHideClosedPositions)}
                  >
                    <Trans>Show closed positions</Trans>
                  </ButtonText>
                )}
              </ErrorContainer>
            )}
          </MainContentWrapper>
          <ThemedText.DeprecatedMain mt={'16px'} fontSize="22px">
            Transactions
          </ThemedText.DeprecatedMain>
          <DarkGreyCard>
            {transactions ? (
              <TransactionTable transactions={transactions} />
            ) : (
              <LoadingRows>
                <div />
              </LoadingRows>
            )}
          </DarkGreyCard>
          <ThemedText.DeprecatedMain mt={'16px'} fontSize="22px">
            Liquidity Transactions
          </ThemedText.DeprecatedMain>
          <DarkGreyCard>
            {liquidityTransactions ? (
              <LiquidityTransactionTable transactions={liquidityTransactions} />
            ) : (
              <LoadingRows>
                <div />
              </LoadingRows>
            )}
          </DarkGreyCard>
        </AutoColumn>
      ) : (
        <LoadingRows>
          <div />
        </LoadingRows>
      )}
    </PageWrapper>
  )
}
