import { Interface } from '@ethersproject/abi'
import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
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
import LiquidityTransactionTable from 'components/Tables/LiquidityTransactionTable'
import TransactionTable from 'components/Tables/TransactionTable'
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
import { isSupportedChain } from 'constants/chains'
import { EthereumNetworkInfo } from 'constants/networks'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useInvestorData } from 'data/FundAccount/investorData'
import { useFundAccountLiquidityTransactions } from 'data/FundAccount/liquidityTransactions'
import { useFundAccountTransactions } from 'data/FundAccount/transactions'
import { useVolumeChartData } from 'data/FundAccount/volumeChartData'
import { useColor } from 'hooks/useColor'
import { useDotoliInfoContract } from 'hooks/useContract'
import { useETHPriceInUSD, usePools, useTokensPriceInUSD } from 'hooks/usePools'
import { useV3Positions } from 'hooks/useV3Positions'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { ErrorContainer, NetworkIcon } from 'pages/Account'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ChevronDown, Inbox, PlusCircle } from 'react-feather'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ClipLoader from 'react-spinners/ClipLoader'
import { useToggleWalletModal } from 'state/application/hooks'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useUserHideClosedPositions } from 'state/user/hooks'
import styled, { css, useTheme } from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { PositionDetails } from 'types/position'
import { IERC20MetadataInterface } from 'types/v3/v3-periphery/artifacts/contracts/interfaces/IERC20Metadata'
import { getEtherscanLink, shortenAddress } from 'utils'
import { formatTime, unixToDate } from 'utils/date'
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

const HoverText = styled(ThemedText.DeprecatedMain)`
  text-decoration: none;
  color: ${({ theme }) => theme.deprecated_text3};
  :hover {
    color: ${({ theme }) => theme.deprecated_text1};
    text-decoration: none;
  }
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
  const currentPageFund = params.fundId
  const investor = params.investor
  const newPositionLink = '/add/' + currentPageFund + '/' + investor + '/ETH'
  const navigate = useNavigate()
  const toggleWalletModal = useToggleWalletModal()
  const DotoliInfoContract = useDotoliInfoContract()
  const [activeNetwork] = useActiveNetworkVersion()
  const { chainId, account } = useWeb3React()
  const [userHideClosedPositions, setUserHideClosedPositions] = useUserHideClosedPositions()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // theming
  const backgroundColor = useColor()
  const theme = useTheme()

  const { loading: myManagingFundLoading, result: [myManagingFund] = [] } = useSingleCallResult(
    DotoliInfoContract,
    'managingFund',
    [account ?? undefined]
  )
  const { loading: investorManagingFundLoading, result: [investorManagingFund] = [] } = useSingleCallResult(
    DotoliInfoContract,
    'managingFund',
    [investor ?? undefined]
  )

  const [isManagerAccount, setIsManagerAccount] = useState<boolean>(false)
  useEffect(() => {
    if (!investorManagingFundLoading) {
      setState()
    }
    async function setState() {
      if (
        investorManagingFund &&
        currentPageFund &&
        investorManagingFund.toString() !== '0' &&
        investorManagingFund.toString() === currentPageFund.toString()
      ) {
        setIsManagerAccount(true)
      } else {
        setIsManagerAccount(false)
      }
    }
  }, [investorManagingFundLoading, investorManagingFund, currentPageFund, investor])

  const [userIsManager, setUserIsManager] = useState<boolean>(false)
  useEffect(() => {
    if (!myManagingFundLoading) {
      setState()
    }
    async function setState() {
      if (
        myManagingFund &&
        currentPageFund &&
        myManagingFund.toString() !== '0' &&
        myManagingFund.toString() === currentPageFund.toString()
      ) {
        setUserIsManager(true)
      } else {
        setUserIsManager(false)
      }
    }
  }, [myManagingFundLoading, myManagingFund, currentPageFund, account])

  const [userIsInvestor, setUserIsInvestor] = useState<boolean>(false)
  useEffect(() => {
    if (investor && account) {
      if (!userIsManager && investor.toUpperCase() === account.toUpperCase()) {
        setUserIsInvestor(true)
      } else {
        setUserIsInvestor(false)
      }
    }
  }, [investor, userIsManager, account])

  const investorData = useInvestorData(currentPageFund, investor).data
  const volumeChartData = useVolumeChartData(currentPageFund, investor).data

  const transactions = useFundAccountTransactions(currentPageFund, investor).data
  const liquidityTransactions = useFundAccountLiquidityTransactions(currentPageFund, investor).data

  const [view, setView] = useState(ChartView.VOL_USD)

  // chart hover index
  const [volumeIndexHover, setVolumeIndexHover] = useState<number | undefined>()
  const [tokenIndexHover, setTokenIndexHover] = useState<number | undefined>()

  const { positions, loading: positionsLoading } = useV3Positions(currentPageFund, investor)
  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.liquidity?.isZero() ? 1 : 0].push(p)
      return acc
    },
    [[], []]
  ) ?? [[], []]

  const filteredPositions = [...openPositions, ...(userHideClosedPositions ? [] : closedPositions)]

  const formattedVolumeChart = useMemo(() => {
    if (volumeChartData) {
      return volumeChartData.map((data, index) => {
        return {
          time: data.timestamp,
          current: data.currentUSD,
          pool: data.poolUSD,
          principal: data.principalUSD,
          tokens: data.tokens,
          symbols: data.tokensSymbols,
          tokensVolume: data.tokensAmountUSD,
          index,
        }
      })
    } else {
      return []
    }
  }, [volumeChartData])

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

  if (chainId && openPositions && openPositions.length > 0) {
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

  const poolTokensDecimalsInfo = useMultipleContractSingleData(poolTokens, ERC20_METADATA_INTERFACE, 'decimals')
  const poolTokensDecimals = useMemo(() => {
    const decimals: number[] = []
    for (let i = 0; i < poolTokensDecimalsInfo.length; i++) {
      const decimal = poolTokensDecimalsInfo[i].result
      if (decimal) {
        decimals.push(Number(decimal))
      } else {
        decimals.push(0)
      }
    }
    return decimals
  }, [poolTokensDecimalsInfo])

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

  const positionTokens: [Token | undefined, Token | undefined, FeeAmount | undefined][] = useMemo(() => {
    if (chainId && openPositions && openPositions.length > 0) {
      return openPositions.map((data, index) => {
        const token0: string = data.token0
        const token1: string = data.token1
        const fee: number = data.fee

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
          return undefined
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
  }, [chainId, openPositions, poolTokens, poolTokensSymbols, poolTokensDecimals])

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

  const currentTokensAmount: CurrencyAmount<Token>[] = useMemo(() => {
    if (chainId && investorData) {
      return investorData.currentTokens.map((data, index) => {
        const decimals = investorData.currentTokensDecimals[index]
        const symbol = investorData.currentTokensSymbols[index]
        const token = new Token(chainId, data, decimals, symbol)
        const decimal = 10 ** decimals
        return CurrencyAmount.fromRawAmount(token, Math.floor(investorData.currentTokensAmount[index] * decimal))
      })
    } else {
      return []
    }
  }, [chainId, investorData])

  const findTokenIndex = (tokens: CurrencyAmount<Token>[], token: string): number => {
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].currency.address.toUpperCase() === token.toUpperCase()) {
        return i
      }
    }
    return -1
  }

  const poolTokensAmount: CurrencyAmount<Token>[] = []
  if (poolPositions) {
    for (let i = 0; i < poolPositions.length; i++) {
      const token0Address = poolPositions[i].pool.token0.address
      const token1Address = poolPositions[i].pool.token1.address
      const token0Amount = poolPositions[i].amount0
      const token1Amount = poolPositions[i].amount1

      // sum if token0 duplicated
      const token0Index = findTokenIndex(poolTokensAmount, token0Address)
      if (token0Index > -1) {
        poolTokensAmount[token0Index] = poolTokensAmount[token0Index].add(token0Amount)
      } else {
        poolTokensAmount.push(poolPositions[i].amount0)
      }
      // sum if token1 duplicated
      const token1Index = findTokenIndex(poolTokensAmount, token1Address)
      if (token1Index > -1) {
        poolTokensAmount[token1Index] = poolTokensAmount[token1Index].add(token1Amount)
      } else {
        poolTokensAmount.push(poolPositions[i].amount1)
      }
    }
  }

  const weth9 = chainId ? WRAPPED_NATIVE_CURRENCY[chainId] : undefined
  const ethPriceInUSDC = useETHPriceInUSD(chainId)
  const currentTokensAmountUSD = useTokensPriceInUSD(chainId, weth9, ethPriceInUSDC, currentTokensAmount)
  const poolTokensAmountUSD = useTokensPriceInUSD(chainId, weth9, ethPriceInUSDC, poolTokensAmount)

  const formattedLatestTokens = useMemo(() => {
    if (currentTokensAmountUSD && poolTokensAmountUSD) {
      // 1. get current tokens
      const tokensData = currentTokensAmountUSD.map((data, index) => {
        const token = data[0].currency
        const tokenAddress = token.address
        const symbol = token.symbol ? token.symbol : 'Unknown'
        const decimal = token.decimals
        const currentAmount = Number(data[0].quotient.toString()) / Number(10 ** decimal)
        const currentAmountUSD = data[1]
        return {
          token: tokenAddress,
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
        const token = data[0].currency
        const tokenAddress = token.address
        const symbol = token.symbol ? token.symbol : 'Unknown'
        const decimal = token.decimals
        const poolAmount = Number(data[0].quotient.toString()) / Number(10 ** decimal)

        const poolAmountUSD = data[1]
        let added = false
        for (let i = 0; i < tokensData.length; i++) {
          if (tokenAddress.toUpperCase() === tokensData[i].token.toUpperCase()) {
            tokensData[i].poolAmount = tokensData[i].poolAmount + poolAmount
            tokensData[i].pool = tokensData[i].pool + poolAmountUSD
            added = true
          }
        }
        if (!added) {
          tokensData.push({
            token: tokenAddress,
            symbol,
            decimal,
            currentAmount: 0,
            current: 0, //currentAmountUSD
            poolAmount,
            pool: poolAmountUSD,
            index: tokensData.length,
          })
        }
        return undefined
      })
      return tokensData
    } else {
      return []
    }
  }, [currentTokensAmountUSD, poolTokensAmountUSD])

  if (formattedVolumeChart && formattedVolumeChart.length > 1 && formattedLatestTokens) {
    let totalCurrentAmountUSD = 0
    currentTokensAmountUSD.map((value, index) => {
      const tokenAmountUSD = value[1]
      totalCurrentAmountUSD += tokenAmountUSD
      return undefined
    })
    let totalPoolAmountUSD = 0
    poolTokensAmountUSD.map((value, index) => {
      const tokenAmountUSD = value[1]
      totalPoolAmountUSD += tokenAmountUSD
      return undefined
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

    formattedVolumeChart.push({
      time: Math.floor(new Date().getTime() / 1000),
      current: totalCurrentAmountUSD,
      pool: totalPoolAmountUSD,
      principal: formattedVolumeChart[formattedVolumeChart.length - 1].principal,
      tokens,
      symbols,
      tokensVolume,
      index: formattedVolumeChart.length,
    })
  }

  const volumeChartHoverIndex = volumeIndexHover !== undefined ? volumeIndexHover : undefined

  const principalHover = useMemo(() => {
    if (volumeChartHoverIndex !== undefined && formattedVolumeChart) {
      const volumeUSDData = formattedVolumeChart[volumeChartHoverIndex]
      return volumeUSDData.principal
    } else if (formattedVolumeChart.length > 0) {
      return formattedVolumeChart[formattedVolumeChart.length - 1].principal
    } else {
      return undefined
    }
  }, [volumeChartHoverIndex, formattedVolumeChart])

  const tokenHover = useMemo(() => {
    if (volumeChartHoverIndex !== undefined && formattedVolumeChart) {
      const volumeUSDData = formattedVolumeChart[volumeChartHoverIndex]
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
  }, [volumeChartHoverIndex, formattedVolumeChart, formattedLatestTokens])

  const ratio = useMemo(() => {
    return volumeChartHoverIndex !== undefined && formattedVolumeChart[volumeChartHoverIndex].principal > 0
      ? Number(
          (
            ((formattedVolumeChart[volumeChartHoverIndex].current +
              formattedVolumeChart[volumeChartHoverIndex].pool -
              formattedVolumeChart[volumeChartHoverIndex].principal) /
              formattedVolumeChart[volumeChartHoverIndex].principal) *
            100
          ).toFixed(2)
        )
      : volumeChartHoverIndex !== undefined && formattedVolumeChart[volumeChartHoverIndex].principal === 0
      ? Number(0)
      : formattedVolumeChart && formattedVolumeChart.length > 0
      ? Number(
          (
            ((formattedVolumeChart[formattedVolumeChart.length - 1].current +
              formattedVolumeChart[formattedVolumeChart.length - 1].pool -
              formattedVolumeChart[formattedVolumeChart.length - 1].principal) /
              formattedVolumeChart[formattedVolumeChart.length - 1].principal) *
            100
          ).toFixed(2)
        )
      : Number(0)
  }, [volumeChartHoverIndex, formattedVolumeChart])

  const menuItems1 = [
    {
      content: (
        <MenuItem>
          <Trans>Deposit</Trans>
          <PlusCircle size={16} />
        </MenuItem>
      ),
      link: `/deposit/${currentPageFund}/${investor}`,
      external: false,
    },
    {
      content: (
        <MenuItem>
          <Trans>Withdraw</Trans>
          <BookOpen size={16} />
        </MenuItem>
      ),
      link: `/withdraw/${currentPageFund}/${investor}`,
      external: false,
    },
  ]

  const Buttons = () =>
    !account ? (
      <ButtonPrimary
        $borderRadius="12px"
        margin={'6px'}
        padding={'12px'}
        data-testid="navbar-connect-wallet"
        onClick={toggleWalletModal}
      >
        <ThemedText.DeprecatedMain mb="4px">
          <Trans>Connect Wallet</Trans>
        </ThemedText.DeprecatedMain>
      </ButtonPrimary>
    ) : isManagerAccount ? (
      <>
        {userIsManager ? (
          <>
            <ButtonPrimary
              $borderRadius="12px"
              mr="12px"
              padding={'12px'}
              onClick={() => {
                navigate(`/swap/${currentPageFund}/${investor}`)
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
        ) : null}
      </>
    ) : userIsManager ? (
      <>
        <ButtonPrimary
          $borderRadius="12px"
          mr="12px"
          padding={'12px'}
          onClick={() => {
            navigate(`/swap/${currentPageFund}/${investor}`)
          }}
        >
          <ThemedText.DeprecatedMain mb="4px">
            <Trans>Swap</Trans>
          </ThemedText.DeprecatedMain>
        </ButtonPrimary>
      </>
    ) : userIsInvestor ? (
      <>
        <ButtonPrimary
          $borderRadius="12px"
          mr="12px"
          padding={'12px'}
          onClick={() => {
            navigate(`/deposit/${currentPageFund}/${investor}`)
          }}
        >
          <ThemedText.DeprecatedMain mb="4px">
            <Trans>Deposit</Trans>
          </ThemedText.DeprecatedMain>
        </ButtonPrimary>
        <ButtonPrimary
          $borderRadius="12px"
          mr="12px"
          padding={'12px'}
          onClick={() => {
            navigate(`/withdraw/${currentPageFund}/${investor}`)
          }}
        >
          <ThemedText.DeprecatedMain mb="4px">
            <Trans>Withdraw</Trans>
          </ThemedText.DeprecatedMain>
        </ButtonPrimary>
      </>
    ) : null

  if (!isSupportedChain(chainId)) {
    return (
      <ErrorContainer>
        <ThemedText.DeprecatedBody color={theme.deprecated_text2} textAlign="center">
          <NetworkIcon strokeWidth={1.2} />
          <div data-testid="pools-unsupported-err">
            <Trans>Your connected network is unsupported.</Trans>
          </div>
        </ThemedText.DeprecatedBody>
      </ErrorContainer>
    )
  } else {
    return (
      <PageWrapper>
        <ThemedBackground backgroundColor={backgroundColor} />
        {investorData && chainId ? (
          <AutoColumn gap="16px">
            <RowBetween>
              <AutoRow gap="4px">
                <Link
                  data-cy="visit-pool"
                  style={{ textDecoration: 'none', width: 'fit-content', marginBottom: '0.5rem' }}
                  to={`/fund/${investorData.fundId}`}
                >
                  <HoverText>
                    <Trans>← Back to Fund</Trans>
                  </HoverText>
                </Link>
              </AutoRow>
            </RowBetween>
            <ResponsiveRow align="flex-end">
              <ExternalLink href={getEtherscanLink(chainId, investorData.investor, 'address', activeNetwork)}>
                <ThemedText.DeprecatedLabel ml="8px" mr="8px" fontSize="24px">
                  {investorData.isManager ? <Trans>Manager </Trans> : <Trans>Investor </Trans>} :{' '}
                  {shortenAddress(investorData.investor)}
                </ThemedText.DeprecatedLabel>
              </ExternalLink>
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
                    <ThemedText.DeprecatedMain ml="8px">
                      <Trans>Total Asset Tokens</Trans>
                    </ThemedText.DeprecatedMain>
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
                      <Trans>Total Asset</Trans>
                    </ToggleElement>
                    <ToggleElement
                      isActive={view === ChartView.TOKENS}
                      fontSize="12px"
                      onClick={() => (view === ChartView.TOKENS ? {} : setView(ChartView.TOKENS))}
                    >
                      <Trans>Tokens</Trans>
                    </ToggleElement>
                  </ToggleWrapper>
                </ToggleRow>
                {view === ChartView.VOL_USD ? (
                  <ComposedChart
                    data={formattedVolumeChart}
                    color={activeNetwork.primaryColor}
                    setIndex={setVolumeIndexHover}
                    topLeft={
                      <AutoColumn gap="4px">
                        <ThemedText.DeprecatedLargeHeader fontSize="32px">
                          <MonoSpace>
                            {formatDollarAmount(
                              volumeIndexHover !== undefined && formattedVolumeChart && formattedVolumeChart.length > 0
                                ? formattedVolumeChart[volumeIndexHover].current +
                                    formattedVolumeChart[volumeIndexHover].pool
                                : formattedVolumeChart && formattedVolumeChart.length > 0
                                ? formattedVolumeChart[formattedVolumeChart.length - 1].current +
                                  formattedVolumeChart[formattedVolumeChart.length - 1].pool
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
                                  ? formattedVolumeChart[volumeIndexHover].current
                                  : formattedVolumeChart && formattedVolumeChart.length > 0
                                  ? formattedVolumeChart[formattedVolumeChart.length - 1].current
                                  : 0
                              )}
                            </MonoSpace>
                          </ThemedText.DeprecatedMediumHeader>
                          &nbsp;&nbsp;
                          <ThemedText.DeprecatedMediumHeader fontSize="18px" color={'#3377ff'}>
                            <MonoSpace>
                              {formatDollarAmount(
                                volumeIndexHover !== undefined
                                  ? formattedVolumeChart[volumeIndexHover].pool
                                  : formattedVolumeChart && formattedVolumeChart.length > 0
                                  ? formattedVolumeChart[formattedVolumeChart.length - 1].pool
                                  : 0
                              )}
                            </MonoSpace>
                          </ThemedText.DeprecatedMediumHeader>
                          &nbsp;&nbsp;
                          <ThemedText.DeprecatedMediumHeader fontSize="18px" color={'#99FF99'}>
                            <MonoSpace>
                              {formatDollarAmount(
                                principalHover !== undefined
                                  ? principalHover
                                  : formattedVolumeChart && formattedVolumeChart.length > 0
                                  ? formattedVolumeChart[formattedVolumeChart.length - 1].principal
                                  : 0
                              )}
                            </MonoSpace>
                          </ThemedText.DeprecatedMediumHeader>
                        </AutoRow>
                        <ThemedText.DeprecatedMain fontSize="14px" height="14px" mb={'30px'}>
                          {volumeIndexHover !== undefined ? (
                            <MonoSpace>
                              {unixToDate(Number(formattedVolumeChart[volumeIndexHover].time))} (
                              {formatTime(formattedVolumeChart[volumeIndexHover].time.toString(), 8)})
                            </MonoSpace>
                          ) : formattedVolumeChart && formattedVolumeChart.length > 0 ? (
                            <MonoSpace>
                              {unixToDate(formattedVolumeChart[formattedVolumeChart.length - 1].time)} (
                              {formatTime(formattedVolumeChart[formattedVolumeChart.length - 1].time.toString(), 8)})
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
                            {tokenIndexHover !== undefined && formattedLatestTokens && formattedLatestTokens.length > 0
                              ? formattedLatestTokens[tokenIndexHover].symbol === 'WETH'
                                ? 'ETH'
                                : formattedLatestTokens[tokenIndexHover].symbol
                              : formattedLatestTokens && formattedLatestTokens.length > 0
                              ? formattedLatestTokens[0].symbol === 'WETH'
                                ? 'ETH'
                                : formattedLatestTokens[0].symbol
                              : null}
                            &nbsp;&nbsp;
                          </ThemedText.DeprecatedMediumHeader>
                          {tokenIndexHover !== undefined &&
                          formattedLatestTokens &&
                          formattedLatestTokens.length > 0 ? (
                            <ThemedText.DeprecatedMain fontSize="14px">
                              <MonoSpace>{shortenAddress(formattedLatestTokens[tokenIndexHover].token)}</MonoSpace>
                            </ThemedText.DeprecatedMain>
                          ) : formattedLatestTokens && formattedLatestTokens.length > 0 ? (
                            <ThemedText.DeprecatedMain fontSize="14px">
                              <MonoSpace>{shortenAddress(formattedLatestTokens[0].token)}</MonoSpace>
                            </ThemedText.DeprecatedMain>
                          ) : null}
                        </AutoRow>
                        <ThemedText.DeprecatedLargeHeader fontSize="32px">
                          {tokenIndexHover !== undefined &&
                          formattedLatestTokens &&
                          formattedLatestTokens.length > 0 ? (
                            <MonoSpace>
                              {formatDollarAmount(
                                formattedLatestTokens[tokenIndexHover].current +
                                  formattedLatestTokens[tokenIndexHover].pool
                              )}
                            </MonoSpace>
                          ) : formattedLatestTokens && formattedLatestTokens.length > 0 ? (
                            <MonoSpace>
                              {formatDollarAmount(formattedLatestTokens[0].current + formattedLatestTokens[0].pool)}
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
                          {tokenIndexHover !== undefined &&
                          formattedLatestTokens &&
                          formattedLatestTokens.length > 0 ? (
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
                          ) : formattedLatestTokens && formattedLatestTokens.length > 0 ? (
                            <>
                              <ThemedText.DeprecatedMediumHeader fontSize="20px" color={'#ff1a75'}>
                                <MonoSpace>{formatAmount(formattedLatestTokens[0].currentAmount)}</MonoSpace>
                              </ThemedText.DeprecatedMediumHeader>
                              <ThemedText.DeprecatedMain fontSize="20px">
                                <MonoSpace> ({formatDollarAmount(formattedLatestTokens[0].current)})</MonoSpace>
                              </ThemedText.DeprecatedMain>
                            </>
                          ) : null}
                        </AutoRow>
                        <AutoRow justify="end">
                          {tokenIndexHover !== undefined &&
                          formattedLatestTokens &&
                          formattedLatestTokens.length > 0 ? (
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
                          ) : formattedLatestTokens && formattedLatestTokens.length > 0 ? (
                            <>
                              <ThemedText.DeprecatedMediumHeader fontSize="20px" color={'#3377ff'}>
                                <MonoSpace>{formatAmount(formattedLatestTokens[0].poolAmount)}</MonoSpace>
                              </ThemedText.DeprecatedMediumHeader>
                              <ThemedText.DeprecatedMain fontSize="20px">
                                <MonoSpace> ({formatDollarAmount(formattedLatestTokens[0].pool)})</MonoSpace>
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
              <ThemedText.DeprecatedMain fontSize="24px">
                <Trans>Positions</Trans>
              </ThemedText.DeprecatedMain>
              {userIsManager ? (
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
              <Trans>Transactions</Trans>
            </ThemedText.DeprecatedMain>
            <DarkGreyCard>
              {transactions ? (
                <TransactionTable transactions={transactions} isFundPage={false} />
              ) : (
                <LoadingRows>
                  <div />
                </LoadingRows>
              )}
            </DarkGreyCard>
            <ThemedText.DeprecatedMain mt={'16px'} fontSize="22px">
              <Trans>Liquidity Transactions</Trans>
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
          <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', marginTop: '280px' }}>
            <ClipLoader color={'#ffffff'} loading={true} size={50} aria-label="Loading Spinner" data-testid="loader" />
          </div>
        )}
      </PageWrapper>
    )
  }
}
