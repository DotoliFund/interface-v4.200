import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { ButtonGray, ButtonPrimary, ButtonText } from 'components/Button'
import { DarkGreyCard, GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import LineChart from 'components/LineChart/chart1'
import Loader from 'components/Loader'
import { FlyoutAlignment, NewMenu } from 'components/Menu'
import PositionList from 'components/PositionList'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { MonoSpace } from 'components/shared'
import { ToggleElementFree, ToggleWrapper } from 'components/Toggle/index'
import TransactionTable from 'components/TransactionsTable'
import LiquidityTransactionTable from 'components/TransactionsTable/LiquidityTransactionTable'
import { ArbitrumNetworkInfo, EthereumNetworkInfo } from 'constants/networks'
import { useInvestorChartData } from 'data/FundAccount/chartData'
import { useInvestorData } from 'data/FundAccount/investorData'
import { useFundAccountLiquidityTransactions } from 'data/FundAccount/liquidityTransactions'
import { useFundAccountTransactions } from 'data/FundAccount/transactions'
import { useColor } from 'hooks/useColor'
import { useXXXFactoryContract } from 'hooks/useContract'
import { useV3Positions } from 'hooks/useV3Positions'
import { useSingleCallResult } from 'lib/hooks/multicall'
import React, { useEffect, useMemo, useState } from 'react'
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
  grid-template-columns: 300px 1fr;
  grid-gap: 1em;

  @media screen and (max-width: 800px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
`

const TokenButton = styled(GreyCard)`
  padding: 8px 12px;
  border-radius: 10px;
  :hover {
    cursor: pointer;
    opacity: 0.6;
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
  VOL_ETH,
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
  const { account, chainId, provider } = useWeb3React()
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

  const formattedVolumeETH = useMemo(() => {
    if (chartData) {
      return chartData.map((data) => {
        return {
          time: unixToDate(data.timestamp),
          volume: data.volumeETH,
          principal: data.principalETH,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedVolumeUSD = useMemo(() => {
    if (chartData) {
      return chartData.map((data) => {
        return {
          time: unixToDate(data.timestamp),
          volume: data.volumeUSD,
          principal: data.principalUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedTokensData = useMemo(() => {
    if (chartData) {
      return chartData.map((data) => {
        return {
          time: unixToDate(data.timestamp),
          value: data.volumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const [view, setView] = useState(ChartView.VOL_ETH)
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()

  const { positions, loading: positionsLoading } = useV3Positions(fundAddress, investorAddress)

  const [openPositions, closedPositions] = positions?.reduce<[PositionDetails[], PositionDetails[]]>(
    (acc, p) => {
      acc[p.liquidity?.isZero() ? 1 : 0].push(p)
      return acc
    },
    [[], []]
  ) ?? [[], []]

  const filteredPositions = [...openPositions, ...(userHideClosedPositions ? [] : closedPositions)]

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
              <ThemedText.DeprecatedLabel>{`${shortenAddress(investorData.investor)}`}</ThemedText.DeprecatedLabel>
              <ThemedText.DeprecatedMain>{` > `}</ThemedText.DeprecatedMain>
              <ThemedText.DeprecatedLabel>{`${shortenAddress(investorData.manager)}`}</ThemedText.DeprecatedLabel>
            </AutoRow>
          </RowBetween>
          <ResponsiveRow align="flex-end">
            <ThemedText.DeprecatedLabel ml="8px" mr="8px" fontSize="24px">{`${shortenAddress(
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
                <GreyCard padding="16px">
                  <AutoColumn gap="md">
                    <ThemedText.DeprecatedMain>Manager</ThemedText.DeprecatedMain>
                    <RowBetween>
                      <RowFixed>
                        <ThemedText.DeprecatedLabel fontSize="14px" ml="8px">
                          {shortenAddress(investorData.manager)}
                        </ThemedText.DeprecatedLabel>
                      </RowFixed>
                    </RowBetween>
                  </AutoColumn>
                </GreyCard>
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontWeight={400}>TVL</ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="24px">
                    {formatDollarAmount(investorData.volumeUSD)}
                  </ThemedText.DeprecatedLabel>
                </AutoColumn>
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontWeight={400}>Principal</ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="24px">
                    {formatDollarAmount(investorData.principalUSD)}
                  </ThemedText.DeprecatedLabel>
                </AutoColumn>
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontWeight={400}>Ratio</ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="24px"></ThemedText.DeprecatedLabel>
                  {((investorData.volumeUSD / investorData.principalUSD) * 100).toFixed(2)}%
                </AutoColumn>
              </AutoColumn>
            </DarkGreyCard>
            <DarkGreyCard>
              <ToggleRow align="flex-start">
                <AutoColumn>
                  <ThemedText.DeprecatedLabel fontSize="24px" height="30px">
                    <MonoSpace>
                      {latestValue
                        ? formatDollarAmount(latestValue)
                        : view === ChartView.VOL_ETH
                        ? // ? formatDollarAmount(formattedVolumeData[formattedVolumeData.length - 1]?.value)
                          // : view === ChartView.DENSITY
                          ''
                        : // : formatDollarAmount(formattedTvlData[formattedTvlData.length - 1]?.value)}{' '}
                          ''}
                    </MonoSpace>
                  </ThemedText.DeprecatedLabel>
                  <ThemedText.DeprecatedMain height="20px" fontSize="12px">
                    {valueLabel ? <MonoSpace>{valueLabel} (UTC)</MonoSpace> : ''}
                  </ThemedText.DeprecatedMain>
                </AutoColumn>
                <ToggleWrapper width="240px">
                  <ToggleElementFree
                    isActive={view === ChartView.VOL_ETH}
                    fontSize="12px"
                    onClick={() => (view === ChartView.VOL_ETH ? {} : setView(ChartView.VOL_ETH))}
                  >
                    VolumeETH
                  </ToggleElementFree>
                  {activeNetwork === ArbitrumNetworkInfo ? null : (
                    <ToggleElementFree
                      isActive={view === ChartView.VOL_USD}
                      fontSize="12px"
                      onClick={() => (view === ChartView.VOL_USD ? {} : setView(ChartView.VOL_USD))}
                    >
                      VolumeUSD
                    </ToggleElementFree>
                  )}
                  <ToggleElementFree
                    isActive={view === ChartView.TOKENS}
                    fontSize="12px"
                    onClick={() => (view === ChartView.TOKENS ? {} : setView(ChartView.TOKENS))}
                  >
                    Tokens
                  </ToggleElementFree>
                </ToggleWrapper>
              </ToggleRow>
              {view === ChartView.VOL_ETH ? (
                <LineChart
                  // data={[
                  //   { name: 'a', value: [12, 30] },
                  //   { name: 'b', value: [5, 13] },
                  //   { name: 'c', value: [13, 31] },
                  //   { name: 'd', value: [24, 53] },
                  //   { name: 'e', value: [40, 43] },
                  //   { name: 'f', value: [54, 36] },
                  //   { name: 'g', value: [64, 26] },
                  // ]}
                  data={formattedVolumeETH}
                  height={220}
                  minHeight={332}
                  color={activeNetwork.primaryColor}
                  value={undefined}
                  label={undefined}
                  setValue={undefined}
                  setLabel={undefined}
                  topLeft={
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMediumHeader fontSize="16px">TVL</ThemedText.DeprecatedMediumHeader>
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        <MonoSpace>
                          {formattedVolumeETH && formattedVolumeETH[formattedVolumeETH.length - 1]
                            ? formattedVolumeETH[formattedVolumeETH.length - 1].volume.toFixed(5)
                            : 0}
                          {' ETH'}
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
                    </AutoColumn>
                  }
                ></LineChart>
              ) : view === ChartView.VOL_USD ? (
                <LineChart
                  // data={[
                  //   { name: 'a', value: [12, 30] },
                  //   { name: 'b', value: [5, 13] },
                  //   { name: 'c', value: [13, 31] },
                  //   { name: 'd', value: [24, 53] },
                  //   { name: 'e', value: [40, 43] },
                  //   { name: 'f', value: [54, 36] },
                  //   { name: 'g', value: [64, 26] },
                  // ]}
                  data={formattedVolumeUSD}
                  height={220}
                  minHeight={332}
                  color={activeNetwork.primaryColor}
                  value={undefined}
                  label={undefined}
                  setValue={undefined}
                  setLabel={undefined}
                  topLeft={
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMediumHeader fontSize="16px">TVL</ThemedText.DeprecatedMediumHeader>
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        <MonoSpace>
                          {'$ '}
                          {formattedVolumeUSD && formattedVolumeUSD[formattedVolumeUSD.length - 1]
                            ? formattedVolumeUSD[formattedVolumeUSD.length - 1].volume.toFixed(5)
                            : 0}
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
                      <ThemedText.DeprecatedMain fontSize="12px" height="14px">
                        <MonoSpace>left label (UTC)</MonoSpace>
                      </ThemedText.DeprecatedMain>
                    </AutoColumn>
                  }
                ></LineChart>
              ) : (
                <LineChart
                  data={formattedTokensData}
                  height={220}
                  minHeight={332}
                  color={activeNetwork.primaryColor}
                  value={undefined}
                  label={undefined}
                  setValue={undefined}
                  setLabel={undefined}
                  topLeft={
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMediumHeader fontSize="16px">TVL</ThemedText.DeprecatedMediumHeader>
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        {/* <MonoSpace>{tvlValue} </MonoSpace> */}
                        <MonoSpace>1234 </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
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
