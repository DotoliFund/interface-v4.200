import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import MultiAreaChart from 'components/AreaChart/principal'
import BarChart from 'components/BarChart'
import { ButtonGray, ButtonPrimary, ButtonText } from 'components/Button'
import { DarkGreyCard } from 'components/Card'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import LineChart from 'components/LineChart'
import Loader from 'components/Loader'
import { FlyoutAlignment, NewMenu } from 'components/Menu'
import PieChart from 'components/PieChart'
import PositionList from 'components/PositionList'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { MonoSpace } from 'components/shared'
import { ToggleElementFree, ToggleWrapper } from 'components/Toggle/index'
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
import { networkPrefix } from 'utils/networkPrefix'
import { formatDollarAmount } from 'utils/numbers'

import { LoadingRows } from './styled'

const PIE_HEIGHT = 340

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

const ToggleRow = styled(RowBetween)`
  @media screen and (max-width: 600px) {
    flex-direction: column;
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

const PieWrapper = styled(Card)`
  width: 100%;
  height: ${PIE_HEIGHT}px;
  padding: 1rem;
  display: flex;
  background-color: ${({ theme }) => theme.deprecated_bg0};
  flex-direction: column;
  > * {
    font-size: 1rem;
  }
`

function PositionsLoadingPlaceholder() {
  return (
    <LoadingRows>
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
      <div />
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

  const { loading: accountFundLoading, result: [accountFund] = [] } = useSingleCallResult(
    XXXFactoryContract,
    'getFundByManager',
    [account ?? undefined]
  )
  const { loading: investorFundLoading, result: [investorFund] = [] } = useSingleCallResult(
    XXXFactoryContract,
    'getFundByManager',
    [investorAddress ?? undefined]
  )
  const { loading: isAccountSubscribedLoading, result: [isAccountSubscribed] = [] } = useSingleCallResult(
    XXXFactoryContract,
    'isSubscribed',
    [account, fundAddress]
  )

  const [isManager, setIsManager] = useState<boolean>(false)
  useEffect(() => {
    if (!accountFundLoading) {
      setState()
    }
    async function setState() {
      if (accountFund && fundAddress && accountFund.toUpperCase() === fundAddress.toUpperCase()) {
        setIsManager(true)
      }
    }
  }, [accountFundLoading, accountFund, fundAddress, account])

  const [isManagerAccount, setIsManagerAccount] = useState<boolean>(false)
  useEffect(() => {
    if (!investorFundLoading) {
      setState()
    }
    async function setState() {
      if (investorFund && fundAddress && investorFund.toUpperCase() === fundAddress.toUpperCase()) {
        setIsManagerAccount(true)
      }
    }
  }, [investorFundLoading, investorFund, fundAddress, investorAddress])

  const [isInvestor, setIsInvestor] = useState<boolean>(false)
  useEffect(() => {
    if (!isAccountSubscribedLoading) {
      setState()
    }
    async function setState() {
      if (
        accountFund &&
        fundAddress &&
        accountFund.toUpperCase() !== fundAddress.toUpperCase() &&
        isAccountSubscribed
      ) {
        setIsInvestor(true)
      }
    }
  }, [accountFund, fundAddress, isAccountSubscribedLoading, isAccountSubscribed])

  const [isInvestorAccount, setIsInvestorAccount] = useState<boolean>(false)
  useEffect(() => {
    if (!investorFundLoading) {
      setState()
    }
    async function setState() {
      if (investorFund && fundAddress && investorFund.toUpperCase() !== fundAddress.toUpperCase()) {
        setIsInvestorAccount(true)
      }
    }
  }, [investorFund, fundAddress, investorFundLoading])

  const investorData = useInvestorData(fundAddress, investorAddress).data
  const chartData = useInvestorChartData(fundAddress, investorAddress).data
  const transactions = useFundAccountTransactions(fundAddress, investorAddress).data
  const liquidityTransactions = useFundAccountLiquidityTransactions(fundAddress, investorAddress).data

  const [view, setView] = useState(ChartView.VOL_USD)
  // Area chart hover
  const [dateHover, setDateHover] = useState<string | undefined>()
  const [volumeHover, setVolumeHover] = useState<number | undefined>()
  const [principalHover, setPrincipalHover] = useState<number | undefined>()
  const [tokensHover, setTokensHover] = useState<string[] | undefined>()
  const [symbolsHover, setSymbolsHover] = useState<string[] | undefined>()
  const [tokensVolumeUSDHover, setTokensVolumeUSDHover] = useState<number[] | undefined>()
  // Bar chart hover
  const [tokenVolumeHover, setTokenVolumeHover] = useState<number | undefined>()
  const [tokenAddressHover, setTokenAddressHover] = useState<string | undefined>()
  const [tokenAmountHover, setTokenAmountHover] = useState<number | undefined>()

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
          time: unixToDate(data.timestamp),
          volume: data.volumeUSD,
          principal: data.principalUSD,
          tokens: data.tokens,
          symbols: data.symbols,
          tokensVolume: data.tokensVolumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedTokensData = useMemo(() => {
    if (chartData && tokensHover && symbolsHover && tokensVolumeUSDHover) {
      return tokensHover.map((data, index) => {
        return {
          token: data,
          symbol: symbolsHover[index],
          tokenVolume: tokensVolumeUSDHover[index],
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
          tokenVolume: investorData.tokensVolumeUSD[index],
        }
      })
    } else {
      return []
    }
  }, [investorData])

  const latestVolumeData = useMemo(() => {
    if (investorData) {
      return {
        volume: investorData.volumeUSD,
        principal: investorData.principalUSD,
      }
    } else {
      return undefined
    }
  }, [investorData])

  const ratio = useMemo(() => {
    return volumeHover !== undefined && principalHover !== undefined && principalHover > 0
      ? (((volumeHover - principalHover) / principalHover) * 100).toFixed(2)
      : principalHover === 0
      ? 0
      : latestVolumeData && latestVolumeData.principal > 0
      ? (((latestVolumeData.volume - latestVolumeData.principal) / latestVolumeData.principal) * 100).toFixed(2)
      : 0
  }, [volumeHover, principalHover, latestVolumeData])

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
    {
      content: (
        <MenuItem>
          <Trans>Add Liquidity</Trans>
          <BookOpen size={16} />
        </MenuItem>
      ),
      link: `/swap/${fundAddress}/${investorAddress}`,
      external: false,
    },
    {
      content: (
        <MenuItem>
          <Trans>Remove Liquidity</Trans>
          <BookOpen size={16} />
        </MenuItem>
      ),
      link: `/swap/${fundAddress}/${investorAddress}`,
      external: false,
    },
  ]

  const menuItems2 = [
    {
      content: (
        <MenuItem>
          <Trans>Add Liquidity</Trans>
          <BookOpen size={16} />
        </MenuItem>
      ),
      link: `/swap/${fundAddress}/${investorAddress}`,
      external: false,
    },
    {
      content: (
        <MenuItem>
          <Trans>Remove Liquidity</Trans>
          <BookOpen size={16} />
        </MenuItem>
      ),
      link: `/swap/${fundAddress}/${investorAddress}`,
      external: false,
    },
  ]

  const menuItems3 = [
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
    {
      content: (
        <MenuItem>
          <Trans>Remove Liquidity</Trans>
          <BookOpen size={16} />
        </MenuItem>
      ),
      link: `/swap/${fundAddress}/${investorAddress}`,
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
    ) : isManager && isManagerAccount ? (
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
    ) : isManager && isInvestorAccount ? (
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
    ) : isInvestor && isInvestorAccount ? (
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
          menuItems={menuItems3}
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
    ) : (
      <></>
    )

  return (
    <PageWrapper>
      <ThemedBackground backgroundColor={backgroundColor} />
      {investorData ? (
        <AutoColumn gap="32px">
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
              <AutoColumn gap="lg">
                <AutoRow gap="md">
                  <ThemedText.DeprecatedMain>Manager</ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="14px" ml="8px">
                    {shortenAddress(investorData.manager)}
                  </ThemedText.DeprecatedLabel>
                </AutoRow>
                <PieWrapper>
                  <PieChart
                    data={formattedTokensData ? formattedTokensData : formattedLatestTokensData}
                    color={activeNetwork.primaryColor}
                  />
                  <RowBetween mt="15px">
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMain fontWeight={400}>TVL</ThemedText.DeprecatedMain>
                      <ThemedText.DeprecatedLabel fontSize="24px">
                        {formatDollarAmount(
                          volumeHover !== undefined ? volumeHover : latestVolumeData ? latestVolumeData.volume : 0
                        )}
                      </ThemedText.DeprecatedLabel>
                    </AutoColumn>
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMain fontWeight={400}>Principal</ThemedText.DeprecatedMain>
                      <ThemedText.DeprecatedLabel fontSize="24px">
                        {formatDollarAmount(
                          principalHover !== undefined
                            ? principalHover
                            : latestVolumeData
                            ? latestVolumeData.principal
                            : 0
                        )}
                      </ThemedText.DeprecatedLabel>
                    </AutoColumn>
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMain fontWeight={400}>Ratio</ThemedText.DeprecatedMain>
                      {Number(ratio) === 0 ? (
                        <ThemedText.DeprecatedLabel fontSize="24px">{ratio}%</ThemedText.DeprecatedLabel>
                      ) : Number(ratio) > 0 ? (
                        <ThemedText.DeprecatedLabel fontSize="24px" color={theme.deprecated_red3}>
                          +{ratio}%
                        </ThemedText.DeprecatedLabel>
                      ) : (
                        <ThemedText.DeprecatedLabel fontSize="24px" color={theme.deprecated_blue4}>
                          -{ratio}%
                        </ThemedText.DeprecatedLabel>
                      )}
                    </AutoColumn>
                  </RowBetween>
                </PieWrapper>
              </AutoColumn>
            </DarkGreyCard>
            <DarkGreyCard>
              <ToggleRow align="flex-start">
                <AutoColumn>
                  <ThemedText.DeprecatedLabel fontSize="24px" height="20px"></ThemedText.DeprecatedLabel>
                  <ThemedText.DeprecatedMain height="20px" fontSize="12px"></ThemedText.DeprecatedMain>
                </AutoColumn>
                <ToggleWrapper width="240px">
                  <ToggleElementFree
                    isActive={view === ChartView.VOL_USD}
                    fontSize="12px"
                    onClick={() => (view === ChartView.VOL_USD ? {} : setView(ChartView.VOL_USD))}
                  >
                    VolumeUSD
                  </ToggleElementFree>
                  <ToggleElementFree
                    isActive={view === ChartView.TOKENS}
                    fontSize="12px"
                    onClick={() => (view === ChartView.TOKENS ? {} : setView(ChartView.TOKENS))}
                  >
                    Tokens
                  </ToggleElementFree>
                </ToggleWrapper>
              </ToggleRow>
              {view === ChartView.VOL_USD ? (
                <MultiAreaChart
                  data={formattedVolumeUSD}
                  height={220}
                  minHeight={332}
                  color={activeNetwork.primaryColor}
                  label={dateHover}
                  value={volumeHover}
                  setLabel={setDateHover}
                  setValue={setVolumeHover}
                  setPrincipal={setPrincipalHover}
                  setTokens={setTokensHover}
                  setSymbols={setSymbolsHover}
                  setTokensVolumeUSD={setTokensVolumeUSDHover}
                  topLeft={
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMediumHeader fontSize="16px">TVL</ThemedText.DeprecatedMediumHeader>
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        <MonoSpace>
                          {'$ '}
                          {volumeHover
                            ? volumeHover.toFixed(2)
                            : formattedVolumeUSD && formattedVolumeUSD[formattedVolumeUSD.length - 1]
                            ? formattedVolumeUSD[formattedVolumeUSD.length - 1].volume.toFixed(2)
                            : 0}
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
                      <ThemedText.DeprecatedMain fontSize="12px" height="14px">
                        {dateHover ? <MonoSpace>{dateHover} (UTC)</MonoSpace> : null}
                      </ThemedText.DeprecatedMain>
                    </AutoColumn>
                  }
                />
              ) : view === ChartView.TOKENS ? (
                <BarChart
                  data={formattedLatestTokensData}
                  height={220}
                  minHeight={332}
                  color={activeNetwork.primaryColor}
                  label={tokenAddressHover}
                  value={tokenVolumeHover}
                  amount={tokenAmountHover}
                  setLabel={setTokenAddressHover}
                  setValue={setTokenVolumeHover}
                  setAmount={setTokenAmountHover}
                  topLeft={
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        <MonoSpace>
                          {formatDollarAmount(tokenVolumeHover !== undefined ? tokenVolumeHover : 0)}
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>{' '}
                      {tokenAmountHover}
                    </AutoColumn>
                  }
                  topRight={
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMain fontSize="12px" height="14px">
                        {tokenAddressHover ? <MonoSpace>{tokenAddressHover}</MonoSpace> : null}
                      </ThemedText.DeprecatedMain>
                    </AutoColumn>
                  }
                />
              ) : (
                <LineChart
                  data={formattedVolumeUSD}
                  height={220}
                  minHeight={332}
                  color={activeNetwork.primaryColor}
                  value={volumeHover}
                  label={dateHover}
                  setLabel={setDateHover}
                  setValue={setVolumeHover}
                  topLeft={
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMediumHeader fontSize="16px">Tokens</ThemedText.DeprecatedMediumHeader>
                    </AutoColumn>
                  }
                ></LineChart>
              )}
            </DarkGreyCard>
          </ContentLayout>
          <TitleRow padding={'0'}>
            <ThemedText.DeprecatedMain fontSize="24px">Positions</ThemedText.DeprecatedMain>

            <ButtonRow>
              <ResponsiveButtonPrimary data-cy="join-pool-button" id="join-pool-button" as={Link} to={newPositionLink}>
                + <Trans>New Position</Trans>
              </ResponsiveButtonPrimary>
            </ButtonRow>
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
          <ThemedText.DeprecatedMain fontSize="24px">Transactions</ThemedText.DeprecatedMain>
          <DarkGreyCard>{transactions ? <TransactionTable transactions={transactions} /> : <Loader />}</DarkGreyCard>
          <ThemedText.DeprecatedMain fontSize="24px">Liquidity Transactions</ThemedText.DeprecatedMain>
          <DarkGreyCard>
            {liquidityTransactions ? <LiquidityTransactionTable transactions={liquidityTransactions} /> : <Loader />}
          </DarkGreyCard>
        </AutoColumn>
      ) : (
        <Loader />
      )}
    </PageWrapper>
  )
}
