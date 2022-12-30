import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import BarChart from 'components/BarChart/stacked'
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
import { useInvestorChartData } from 'data/FundAccount/chartData'
import { useInvestorData } from 'data/FundAccount/investorData'
import { useFundAccountLiquidityTransactions } from 'data/FundAccount/liquidityTransactions'
import { useFundAccountTransactions } from 'data/FundAccount/transactions'
import { useColor } from 'hooks/useColor'
import { useXXXFactoryContract } from 'hooks/useContract'
import { useV3Positions } from 'hooks/useV3Positions'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ChevronDown, Inbox, PlusCircle } from 'react-feather'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useUserHideClosedPositions } from 'state/user/hooks'
import styled, { css, useTheme } from 'styled-components/macro'
import { StyledInternalLink, ThemedText } from 'theme'
import { PositionDetails } from 'types/position'
import { shortenAddress } from 'utils'
import { unixToDate } from 'utils/date'
import { formatTime } from 'utils/date'
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

function PositionsLoadingPlaceholder() {
  return (
    <LoadingRows>
      <div style={{ height: '250px' }} />
    </LoadingRows>
  )
}

enum ChartView {
  VOL_USD,
  TOKENS,
}

export default function FundAccount() {
  const params = useParams()
  const fundAddress = params.fundAddress
  const investorAddress = params.investorAddress
  const newPositionLink = '/add/' + fundAddress + '/' + investorAddress + '/ETH'
  const navigate = useNavigate()
  const XXXFactoryContract = useXXXFactoryContract()
  const [activeNetwork] = useActiveNetworkVersion()
  const { account } = useWeb3React()
  const [userHideClosedPositions, setUserHideClosedPositions] = useUserHideClosedPositions()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // theming
  const backgroundColor = useColor()
  const theme = useTheme()

  const { loading: accountManagingFundLoading, result: [accountManagingFund] = [] } = useSingleCallResult(
    XXXFactoryContract,
    'getFundByManager',
    [account ?? undefined]
  )
  const { loading: investorManagingFundLoading, result: [investorManagingFund] = [] } = useSingleCallResult(
    XXXFactoryContract,
    'getFundByManager',
    [investorAddress ?? undefined]
  )
  const { loading: isAccountSubscribedLoading, result: [isAccountSubscribed] = [] } = useSingleCallResult(
    XXXFactoryContract,
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
  // Composed chart hover
  const [dateHover, setDateHover] = useState<string | undefined>()
  const [volumeHover, setVolumeHover] = useState<number | undefined>()
  const [liquidityHover, setLiquidityHover] = useState<number | undefined>()
  const [principalHover, setPrincipalHover] = useState<number | undefined>()
  const [tokensHover, setTokensHover] = useState<string[] | undefined>()
  const [symbolsHover, setSymbolsHover] = useState<string[] | undefined>()
  const [tokensVolumeUSDHover, setTokensVolumeUSDHover] = useState<number[] | undefined>()
  // Bar chart hover
  const [tokenVolumeHover, setTokenVolumeHover] = useState<number | undefined>()
  const [tokenAmountHover, setTokenAmountHover] = useState<number | undefined>()
  const [liquidityVolumeHover, setLiquidityVolumeHover] = useState<number | undefined>()
  const [liquidityAmountHover, setLiquidityAmountHover] = useState<number | undefined>()
  const [tokenSymbolHover, setTokenSymbolHover] = useState<string | undefined>()
  const [tokenAddressHover, setTokenAddressHover] = useState<string | undefined>()

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
      return chartData.map((data) => {
        return {
          time: data.timestamp,
          Volume: data.volumeUSD,
          Principal: data.principalUSD,
          tokens: data.tokens,
          symbols: data.symbols,
          tokensVolume: data.tokensVolumeUSD,
          Liquidity: data.liquidityVolumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedHoverTokenData = useMemo(() => {
    if (chartData && tokensHover && symbolsHover && tokensVolumeUSDHover) {
      return tokensHover.map((data, index) => {
        return {
          token: data,
          symbol: symbolsHover[index],
          Volume: tokensVolumeUSDHover[index],
        }
      })
    } else {
      return undefined
    }
  }, [chartData, tokensHover, symbolsHover, tokensVolumeUSDHover])

  const formattedLatestTokensData = useMemo(() => {
    if (investorData) {
      return investorData.tokens.map((data, index) => {
        return {
          token: data,
          symbol: investorData.symbols[index],
          amount: investorData.tokensAmount[index],
          Volume: investorData.tokensVolumeUSD[index],
          Liquidity: investorData.liquidityTokensVolumeUSD[index],
          liquidityAmount: investorData.liquidityTokensAmount[index],
        }
      })
    } else {
      return []
    }
  }, [investorData])

  const latestVolumeData = useMemo(() => {
    if (investorData && chartData && chartData.length > 0) {
      return {
        time: chartData[chartData.length - 1].timestamp,
        Volume: investorData.volumeUSD,
        Liquidity: chartData[chartData.length - 1].liquidityVolumeUSD,
        Principal: investorData.principalUSD,
      }
    } else {
      return undefined
    }
  }, [investorData, chartData])

  const ratio = useMemo(() => {
    return volumeHover !== undefined &&
      liquidityHover !== undefined &&
      principalHover !== undefined &&
      principalHover > 0
      ? Number((((volumeHover + liquidityHover - principalHover) / principalHover) * 100).toFixed(2))
      : principalHover === 0
      ? Number(0)
      : latestVolumeData && latestVolumeData.Principal > 0
      ? Number(
          (
            ((latestVolumeData.Volume + latestVolumeData.Liquidity - latestVolumeData.Principal) /
              latestVolumeData.Principal) *
            100
          ).toFixed(2)
        )
      : Number(0)
  }, [volumeHover, liquidityHover, principalHover, latestVolumeData])

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
                <PieChart
                  data={formattedHoverTokenData ? formattedHoverTokenData : formattedLatestTokensData}
                  color={activeNetwork.primaryColor}
                />
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
                  setLabel={setDateHover}
                  setValue={setVolumeHover}
                  setLiquidityVolume={setLiquidityHover}
                  setPrincipal={setPrincipalHover}
                  setTokens={setTokensHover}
                  setSymbols={setSymbolsHover}
                  setTokensVolumeUSD={setTokensVolumeUSDHover}
                  topLeft={
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        <MonoSpace>
                          {formatDollarAmount(
                            volumeHover !== undefined && liquidityHover !== undefined
                              ? volumeHover + liquidityHover
                              : latestVolumeData
                              ? latestVolumeData.Volume + latestVolumeData.Liquidity
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
                              volumeHover !== undefined ? volumeHover : latestVolumeData ? latestVolumeData.Volume : 0
                            )}
                          </MonoSpace>
                        </ThemedText.DeprecatedMediumHeader>
                        &nbsp;&nbsp;
                        <ThemedText.DeprecatedMediumHeader fontSize="18px" color={'#3377ff'}>
                          <MonoSpace>
                            {formatDollarAmount(
                              liquidityHover !== undefined
                                ? liquidityHover
                                : latestVolumeData
                                ? latestVolumeData.Liquidity
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
                                : latestVolumeData
                                ? latestVolumeData.Principal
                                : 0
                            )}
                          </MonoSpace>
                        </ThemedText.DeprecatedMediumHeader>
                      </AutoRow>
                      <ThemedText.DeprecatedMain fontSize="14px" height="14px" mb={'30px'}>
                        {dateHover ? (
                          <MonoSpace>
                            {unixToDate(Number(dateHover))} ( {formatTime(dateHover.toString(), 8)} )
                          </MonoSpace>
                        ) : latestVolumeData ? (
                          <MonoSpace>
                            {unixToDate(latestVolumeData.time)} ( {formatTime(latestVolumeData.time.toString(), 8)})
                          </MonoSpace>
                        ) : null}
                      </ThemedText.DeprecatedMain>
                    </AutoColumn>
                  }
                />
              ) : view === ChartView.TOKENS ? (
                <BarChart
                  data={formattedLatestTokensData}
                  color={activeNetwork.primaryColor}
                  setLabel={setTokenAddressHover}
                  setSymbol={setTokenSymbolHover}
                  setValue={setTokenVolumeHover}
                  setAmount={setTokenAmountHover}
                  setLiquidityValue={setLiquidityVolumeHover}
                  setLiquidityAmount={setLiquidityAmountHover}
                  topLeft={
                    <AutoColumn gap="4px">
                      <AutoRow>
                        <ThemedText.DeprecatedMediumHeader fontSize="18px">
                          {tokenSymbolHover ? tokenSymbolHover : null}
                          &nbsp;&nbsp;
                        </ThemedText.DeprecatedMediumHeader>
                        {tokenAddressHover ? (
                          <ThemedText.DeprecatedMain fontSize="14px">
                            <Link to={'https://www.guru99.com/c-function-pointers.html'}>
                              <MonoSpace>{shortenAddress(tokenAddressHover)}</MonoSpace>
                            </Link>
                          </ThemedText.DeprecatedMain>
                        ) : null}
                      </AutoRow>
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        {tokenAmountHover !== undefined && liquidityAmountHover !== undefined ? (
                          <MonoSpace>{tokenAmountHover + liquidityAmountHover}</MonoSpace>
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
                        {tokenAmountHover && tokenVolumeHover ? (
                          <>
                            <ThemedText.DeprecatedMediumHeader fontSize="26px" color={'#ff1a75'}>
                              <MonoSpace>{formatAmount(tokenAmountHover)}</MonoSpace>
                            </ThemedText.DeprecatedMediumHeader>
                            <ThemedText.DeprecatedMain fontSize="20px">
                              <MonoSpace>({formatDollarAmount(tokenVolumeHover)})</MonoSpace>
                            </ThemedText.DeprecatedMain>
                          </>
                        ) : null}
                      </AutoRow>
                      <AutoRow justify="end">
                        {liquidityAmountHover && liquidityVolumeHover ? (
                          <>
                            <ThemedText.DeprecatedMediumHeader fontSize="26px" color={'#3377ff'}>
                              <MonoSpace>{formatAmount(liquidityAmountHover)}</MonoSpace>
                            </ThemedText.DeprecatedMediumHeader>
                            <ThemedText.DeprecatedMain fontSize="20px">
                              <MonoSpace>({formatDollarAmount(liquidityVolumeHover)})</MonoSpace>
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
