import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { ButtonGray, ButtonPrimary } from 'components/Button'
import { DarkGreyCard, GreyCard } from 'components/Card'
import LineChart from 'components/Chart/LineChart'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Loader from 'components/Loader'
import Percent from 'components/Percent'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { MonoSpace } from 'components/shared'
import { ToggleElementFree, ToggleWrapper } from 'components/Toggle/index'
// import TransactionTable from 'components/TransactionsTable'
import { ArbitrumNetworkInfo, EthereumNetworkInfo } from 'constants/networks'
// import { useFundChartData, useTopFunds, useFundTransactions } from 'state/funds/hooks'
import { useInvestorData } from 'data/InvestorAccount/investorData'
import { useManagerData } from 'data/ManagerAccount/managerData'
import { useColor } from 'hooks/useColor'
import { useXXXFactoryContract } from 'hooks/useContract'
import { PageWrapper, ThemedBackground } from 'pages/styled'
import React, { useEffect, useMemo, useState } from 'react'
import { Download, ExternalLink } from 'react-feather'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { StyledInternalLink, ThemedText } from 'theme'
import { ExternalLink as StyledExternalLink } from 'theme/components'
import { getEtherscanLink } from 'utils'
import { networkPrefix } from 'utils/networkPrefix'
import { formatAmount, formatDollarAmount } from 'utils/numbers'

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

enum ChartView {
  VOL,
  PRICE,
  DENSITY,
  FEES,
}

export default function FundAccount() {
  const params = useParams()
  const fundAddress = params.fundAddress
  const investorAddress = params.investorAddress
  const XXXFactoryContract = useXXXFactoryContract()
  const [activeNetwork] = useActiveNetworkVersion()
  const { account, chainId, provider } = useWeb3React()
  const navigate = useNavigate()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // theming
  const backgroundColor = useColor()
  const theme = useTheme()

  const { loading: isFundByInvestorLoading, result: fundByInvestor } = useSingleCallResult(
    XXXFactoryContract,
    'getFundByManager',
    [account ?? undefined]
  )
  const [isManager, setIsManager] = useState<boolean>(false)
  useEffect(() => {
    if (!isFundByInvestorLoading) {
      setState()
    }
    async function setState() {
      if (fundByInvestor && fundAddress && fundByInvestor[0].toUpperCase() === fundAddress.toUpperCase()) {
        setIsManager(true)
      }
    }
  }, [isFundByInvestorLoading, fundByInvestor, fundAddress, investorAddress, account])

  const { loading: isFundByAccountLoading, result: fundByAccount } = useSingleCallResult(
    XXXFactoryContract,
    'getFundByManager',
    [investorAddress ?? undefined]
  )
  const [isManagerAccount, setIsManagerAccount] = useState<boolean>(false)
  useEffect(() => {
    if (!isFundByAccountLoading) {
      setState()
    }
    async function setState() {
      if (fundByAccount && fundAddress && fundByAccount[0].toUpperCase() === fundAddress.toUpperCase()) {
        setIsManager(true)
      }
    }
  }, [isFundByAccountLoading, fundByAccount, fundAddress, investorAddress, account])

  const { loading: isInvestorLoading, result: isSubscribed } = useSingleCallResult(XXXFactoryContract, 'isSubscribed', [
    investorAddress,
    fundAddress,
  ])
  const [isInvestor, setIsInvestor] = useState<boolean>(false)
  const [isInvestorAccount, setIsInvestorAccount] = useState<boolean>(false)
  useEffect(() => {
    if (!isInvestorLoading) {
      setState()
    }
    async function setState() {
      if (isSubscribed && isSubscribed[0] === true) {
        setIsInvestorAccount(true)
        if (account && investorAddress && account.toUpperCase() === investorAddress.toUpperCase()) {
          setIsInvestor(true)
        }
      }
    }
  }, [isInvestorLoading, isSubscribed, account, investorAddress])

  // token data
  const investorData = useInvestorData(investorAddress).data
  const managerData = useManagerData(investorAddress).data
  // const chartData = useFundChartData(fundAddress)
  // const transactions = useFundTransactions(fundAddress)

  const [view, setView] = useState(ChartView.VOL)
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()

  const formattedTvlData = useMemo(() => {
    return []
  }, [])
  // const formattedTvlData = useMemo(() => {
  //   if (chartData) {
  //     return chartData.map((day) => {
  //       return {
  //         time: unixToDate(day.date),
  //         value: day.totalValueLockedUSD,
  //       }
  //     })
  //   } else {
  //     return []
  //   }
  // }, [chartData])

  const formattedVolumeData = useMemo(() => {
    return []
  }, [])
  // const formattedVolumeData = useMemo(() => {
  //   if (chartData) {
  //     return chartData.map((day) => {
  //       return {
  //         time: unixToDate(day.date),
  //         value: day.volumeUSD,
  //       }
  //     })
  //   } else {
  //     return []
  //   }
  // }, [chartData])

  const formattedFeesUSD = useMemo(() => {
    return []
  }, [])
  // const formattedFeesUSD = useMemo(() => {
  //   if (chartData) {
  //     return chartData.map((day) => {
  //       return {
  //         time: unixToDate(day.date),
  //         value: day.feesUSD,
  //       }
  //     })
  //   } else {
  //     return []
  //   }
  // }, [chartData])

  const Buttons = () =>
    !account ? (
      <ButtonPrimary $borderRadius="12px" padding={'12px'}>
        <ThemedText.DeprecatedMain mb="4px">
          <Trans>Connect Wallet</Trans>
        </ThemedText.DeprecatedMain>
      </ButtonPrimary>
    ) : (isManager || isInvestor) && fundAddress ? (
      <ButtonPrimary
        $borderRadius="12px"
        padding={'12px'}
        onClick={() => {
          return
        }}
      >
        <ThemedText.DeprecatedMain mb="4px">
          <Trans>My Account</Trans>
        </ThemedText.DeprecatedMain>
      </ButtonPrimary>
    ) : (
      <ButtonPrimary
        $borderRadius="12px"
        padding={'12px'}
        onClick={() => {
          return
        }}
      >
        <ThemedText.DeprecatedMain mb="4px">
          <Trans>Subscribe</Trans>
        </ThemedText.DeprecatedMain>
      </ButtonPrimary>
    )

  return (
    <PageWrapper>
      <ThemedBackground backgroundColor={backgroundColor} />
      {fundData ? (
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
              <ThemedText.DeprecatedLabel>{` ${fundData.address} / ${fundData.manager} `}</ThemedText.DeprecatedLabel>
            </AutoRow>
            <RowFixed gap="10px" align="center">
              address ? (
              <StyledExternalLink href={getEtherscanLink(1, fundAddress, 'address', activeNetwork)}>
                <ExternalLink stroke={theme.deprecated_text2} size={'17px'} style={{ marginLeft: '12px' }} />
              </StyledExternalLink>
              ) : (<></>)
            </RowFixed>
          </RowBetween>
          <ResponsiveRow align="flex-end">
            <AutoColumn gap="lg">
              <RowFixed>
                <ThemedText.DeprecatedLabel
                  ml="8px"
                  mr="8px"
                  fontSize="24px"
                >{` ${fundData.investorCount} / ${fundData.createdAtBlockNumber} `}</ThemedText.DeprecatedLabel>
                {activeNetwork === EthereumNetworkInfo ? null : <></>}
              </RowFixed>
              <ResponsiveRow>
                <StyledInternalLink to={networkPrefix(activeNetwork) + 'tokens/' + fundData.createdAtTimestamp}>
                  <TokenButton>
                    <RowFixed>
                      <ThemedText.DeprecatedLabel
                        fontSize="16px"
                        ml="4px"
                        style={{ whiteSpace: 'nowrap' }}
                        width={'fit-content'}
                      ></ThemedText.DeprecatedLabel>
                    </RowFixed>
                  </TokenButton>
                </StyledInternalLink>
                <StyledInternalLink to={networkPrefix(activeNetwork) + 'tokens/' + fundData.address}>
                  <TokenButton ml="10px">
                    <RowFixed>
                      <CurrencyLogo size={'20px'} />
                      <ThemedText.DeprecatedLabel
                        fontSize="16px"
                        ml="4px"
                        style={{ whiteSpace: 'nowrap' }}
                        width={'fit-content'}
                      ></ThemedText.DeprecatedLabel>
                    </RowFixed>
                  </TokenButton>
                </StyledInternalLink>
              </ResponsiveRow>
            </AutoColumn>
            {activeNetwork !== EthereumNetworkInfo ? null : (
              <RowFixed>
                {/* <StyledExternalLink
                  href={`https://app.uniswap.org/#/add/${poolData.token0.address}/${poolData.token1.address}/${poolData.feeTier}`}
                > */}
                <ButtonGray width="170px" mr="12px" style={{ height: '44px' }}>
                  <RowBetween>
                    <Download size={24} />
                    <div style={{ display: 'flex', alignItems: 'center' }}>Add Liquidity</div>
                  </RowBetween>
                </ButtonGray>
                {/* </StyledExternalLink> */}
                {/* <StyledExternalLink
                  href={`https://app.uniswap.org/#/swap?inputCurrency=${poolData.token0.address}&outputCurrency=${poolData.token1.address}`}
                > */}
                <Buttons />
                {/* </StyledExternalLink> */}
              </RowFixed>
            )}
          </ResponsiveRow>
          <ContentLayout>
            <DarkGreyCard>
              <AutoColumn gap="lg">
                <GreyCard padding="16px">
                  <AutoColumn gap="md">
                    <ThemedText.DeprecatedMain>Total Tokens Locked</ThemedText.DeprecatedMain>
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo size={'20px'} />
                        <ThemedText.DeprecatedLabel fontSize="14px" ml="8px">
                          {fundData.manager}
                        </ThemedText.DeprecatedLabel>
                      </RowFixed>
                      <ThemedText.DeprecatedLabel fontSize="14px">
                        {formatAmount(fundData.volumeETH)}
                      </ThemedText.DeprecatedLabel>
                    </RowBetween>
                    <RowBetween>
                      <RowFixed>
                        <CurrencyLogo size={'20px'} />
                        <ThemedText.DeprecatedLabel fontSize="14px" ml="8px">
                          {fundData.address}
                        </ThemedText.DeprecatedLabel>
                      </RowFixed>
                      <ThemedText.DeprecatedLabel fontSize="14px">
                        {formatAmount(fundData.volumeUSD)}
                      </ThemedText.DeprecatedLabel>
                    </RowBetween>
                  </AutoColumn>
                </GreyCard>
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontWeight={400}>TVL</ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="24px">
                    {formatDollarAmount(fundData.principalETH)}
                  </ThemedText.DeprecatedLabel>
                  <Percent value={fundData.profitRatioETH} />
                </AutoColumn>
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontWeight={400}>Volume 24h</ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="24px">
                    {formatDollarAmount(fundData.volumeUSD)}
                  </ThemedText.DeprecatedLabel>
                  <Percent value={fundData.profitRatioUSD} />
                </AutoColumn>
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontWeight={400}>24h Fees</ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="24px"></ThemedText.DeprecatedLabel>
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
                        : view === ChartView.VOL
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
                    isActive={view === ChartView.VOL}
                    fontSize="12px"
                    onClick={() => (view === ChartView.VOL ? setView(ChartView.DENSITY) : setView(ChartView.VOL))}
                  >
                    Volume
                  </ToggleElementFree>
                  {activeNetwork === ArbitrumNetworkInfo ? null : (
                    <ToggleElementFree
                      isActive={view === ChartView.DENSITY}
                      fontSize="12px"
                      onClick={() => (view === ChartView.DENSITY ? setView(ChartView.VOL) : setView(ChartView.DENSITY))}
                    >
                      Liquidity
                    </ToggleElementFree>
                  )}
                  <ToggleElementFree
                    isActive={view === ChartView.FEES}
                    fontSize="12px"
                    onClick={() => (view === ChartView.FEES ? setView(ChartView.VOL) : setView(ChartView.FEES))}
                  >
                    Fees
                  </ToggleElementFree>
                </ToggleWrapper>
              </ToggleRow>
              <LineChart />
            </DarkGreyCard>
          </ContentLayout>
          <ThemedText.DeprecatedMain fontSize="24px">Transactions</ThemedText.DeprecatedMain>
          <DarkGreyCard>
            {/* {transactions ? <TransactionTable transactions={transactions} /> : <LocalLoader fill={false} />} */}
          </DarkGreyCard>
          <ThemedText.DeprecatedMain fontSize="24px">Investors</ThemedText.DeprecatedMain>
        </AutoColumn>
      ) : (
        <Loader />
      )}
    </PageWrapper>
  )
}

// import { Trans } from '@lingui/macro'
// import { Percent } from '@uniswap/sdk-core'
// import { useWeb3React } from '@web3-react/core'
// import { ElementName, Event, EventName } from 'components/AmplitudeAnalytics/constants'
// import { TraceEvent } from 'components/AmplitudeAnalytics/TraceEvent'
// import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
// import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
// import { useParams } from 'react-router-dom'
// import { Text } from 'rebass'
// import { useTheme } from 'styled-components/macro'

// import { ButtonError, ButtonLight } from '../../components/Button'
// import { BlueCard } from '../../components/Card'
// import DoughnutChart from '../../components/Chart/DoughnutChart'
// import LineChart from '../../components/Chart/LineChart'
// import { AutoColumn } from '../../components/Column'
// import { AddRemoveTabs } from '../../components/NavigationTabs'
// import Row, { RowBetween } from '../../components/Row'
// import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
// import { useToggleWalletModal } from '../../state/application/hooks'
// import { ThemedText } from '../../theme'
// import {
//   DynamicSection,
//   PageWrapper,
//   ResponsiveTwoColumns,
//   RightContainer,
//   ScrollablePage,
//   StackedContainer,
//   StackedItem,
//   Wrapper,
// } from './styled'

// const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

// export default function FundAccount() {
//   const navBarFlag = useNavBarFlag()
//   const navBarFlagEnabled = navBarFlag === NavBarVariant.Enabled

//   const { account, chainId, provider } = useWeb3React()
//   const theme = useTheme()
//   const { fund, investor } = useParams<{ fund: string; investor: string }>()

//   function switchToMyAccount() {
//     alert(1234)
//     //navigate(`/add/${currencyIdB as string}/${currencyIdA as string}${feeAmount ? '/' + feeAmount : ''}`)
//     //navigate(`/fund/:fundAddress/:account/`)
//   }
//   function switchToFundAccount() {
//     alert(5678)
//     //navigate(`/add/${currencyIdB as string}/${currencyIdA as string}${feeAmount ? '/' + feeAmount : ''}`)
//     //navigate(`/fund/:fundAddress`)
//   }

//   const toggleWalletModal = useToggleWalletModal() // toggle wallet when disconnected

//   const Buttons = () =>
//     !account ? (
//       <TraceEvent
//         events={[Event.onClick]}
//         name={EventName.CONNECT_WALLET_BUTTON_CLICKED}
//         properties={{ received_swap_quote: false }}
//         element={ElementName.CONNECT_WALLET_BUTTON}
//       >
//         <ButtonLight onClick={toggleWalletModal} $borderRadius="12px" padding={'12px'}>
//           <Trans>Connect Wallet</Trans>
//         </ButtonLight>
//       </TraceEvent>
//     ) : (
//       <AutoColumn gap={'md'}>
//         <ButtonError
//           onClick={() => {
//             return
//           }}
//           disabled={false}
//         >
//           <Text fontWeight={500}>
//             <Trans>Preview</Trans>
//           </Text>
//         </ButtonError>
//       </AutoColumn>
//     )

//   return (
//     <>
//       <ScrollablePage navBarFlag={navBarFlagEnabled}>
//         <PageWrapper wide={true}>
//           <AddRemoveTabs
//             creating={false}
//             adding={true}
//             positionID={'test1234'}
//             defaultSlippage={DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE}
//             showBackLink={true}
//           >
//             <Row justifyContent="flex-end" style={{ width: 'fit-content', minWidth: 'fit-content' }}>
//               <ToggleWrapper width="fit-content">
//                 <ToggleElement
//                   isActive={true}
//                   fontSize="14px"
//                   onClick={() => {
//                     switchToMyAccount()
//                   }}
//                 >
//                   <Trans>My Account</Trans>
//                 </ToggleElement>
//                 <ToggleElement
//                   isActive={false}
//                   fontSize="14px"
//                   onClick={() => {
//                     switchToFundAccount()
//                   }}
//                 >
//                   <Trans>Fund</Trans>
//                 </ToggleElement>
//               </ToggleWrapper>
//             </Row>
//           </AddRemoveTabs>
//           <Wrapper>
//             <ResponsiveTwoColumns wide={true}>
//               <AutoColumn gap="lg">
//                 <RowBetween paddingBottom="20px">
//                   <ThemedText.DeprecatedLabel>
//                     <Trans>Select Pair</Trans>
//                     <Wrapper>
//                       <LineChart />
//                     </Wrapper>
//                   </ThemedText.DeprecatedLabel>
//                 </RowBetween>
//               </AutoColumn>
//               <AutoColumn gap="lg">
//                 <RowBetween paddingBottom="20px">
//                   <ThemedText.DeprecatedLabel>
//                     <Trans>Select Pair2</Trans>
//                     <Wrapper>
//                       <LineChart />
//                     </Wrapper>
//                   </ThemedText.DeprecatedLabel>
//                 </RowBetween>
//               </AutoColumn>
//               {/* <div>
//                 <DynamicSection disabled={false}>
//                   <AutoColumn gap="md">
//                     <ThemedText.DeprecatedLabel>
//                       <Trans>Deposit Amounts</Trans>
//                       <DoughnutChart />
//                     </ThemedText.DeprecatedLabel>
//                   </AutoColumn>
//                 </DynamicSection>
//               </div> */}
//               <RightContainer gap="lg">
//                 <DynamicSection gap="md" disabled={true}>
//                   <AutoColumn gap="md">
//                     <RowBetween>
//                       <ThemedText.DeprecatedLabel>
//                         <DoughnutChart />
//                         <Trans>Set Starting Price</Trans>
//                       </ThemedText.DeprecatedLabel>
//                     </RowBetween>

//                     <BlueCard
//                       style={{
//                         display: 'flex',
//                         flexDirection: 'row',
//                         alignItems: 'center',
//                         padding: '1rem 1rem',
//                       }}
//                     >
//                       <ThemedText.DeprecatedBody
//                         fontSize={14}
//                         style={{ fontWeight: 500 }}
//                         textAlign="left"
//                         color={theme.deprecated_primaryText1}
//                       >
//                         <Trans>
//                           This pool must be initialized before you can add liquidity. To initialize, select a starting
//                           price for the pool. Then, enter your liquidity price range and deposit amount. Gas fees will
//                           be higher than usual due to the initialization transaction.
//                         </Trans>
//                       </ThemedText.DeprecatedBody>
//                     </BlueCard>
//                     <RowBetween
//                       style={{ backgroundColor: theme.deprecated_bg1, padding: '12px', borderRadius: '12px' }}
//                     >
//                       <ThemedText.DeprecatedMain>
//                         <Trans>Current Price:</Trans>
//                       </ThemedText.DeprecatedMain>
//                       <ThemedText.DeprecatedMain>{'-'}</ThemedText.DeprecatedMain>
//                     </RowBetween>
//                   </AutoColumn>
//                 </DynamicSection>

//                 <DynamicSection gap="md" disabled={true}>
//                   <StackedContainer>
//                     <StackedItem style={{ opacity: 1 }}>
//                       <AutoColumn gap="md">
//                         <RowBetween>
//                           <ThemedText.DeprecatedLabel>
//                             <Trans>Set Price Range</Trans>
//                           </ThemedText.DeprecatedLabel>
//                         </RowBetween>
//                       </AutoColumn>
//                     </StackedItem>
//                   </StackedContainer>
//                 </DynamicSection>
//               </RightContainer>
//               <Buttons />
//             </ResponsiveTwoColumns>
//           </Wrapper>
//         </PageWrapper>
//       </ScrollablePage>
//       <SwitchLocaleLink />
//     </>
//   )
// }
