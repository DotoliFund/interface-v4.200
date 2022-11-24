import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import AreaChart from 'components/AreaChart/chart1'
import { ButtonPrimary } from 'components/Button'
import { DarkGreyCard, GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import InvestorTable from 'components/funds/InvestorTable'
import LineChart from 'components/LineChart'
import Loader from 'components/Loader'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import { MonoSpace } from 'components/shared'
import { ToggleElementFree, ToggleWrapper } from 'components/Toggle/index'
import TransactionTable from 'components/TransactionsTable'
import { XXXFACTORY_ADDRESSES } from 'constants/addresses'
import { ArbitrumNetworkInfo, EthereumNetworkInfo } from 'constants/networks'
import { useFundChartData } from 'data/FundPage/chartData'
import { useFundData } from 'data/FundPage/fundData'
import { useFundInvestors } from 'data/FundPage/investors'
import { useFundTransactions } from 'data/FundPage/transactions'
import { useColor } from 'hooks/useColor'
import { useXXXFactoryContract } from 'hooks/useContract'
import { XXXFactory } from 'interface/XXXFactory'
import { useSingleCallResult } from 'lib/hooks/multicall'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useToggleWalletModal } from 'state/application/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { StyledInternalLink, ThemedText } from 'theme'
import { shortenAddress } from 'utils'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { unixToDate } from 'utils/date'
import { networkPrefix } from 'utils/networkPrefix'
import { formatDollarAmount } from 'utils/numbers'

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

enum ChartView {
  VOL_ETH,
  VOL_USD,
  TOKENS,
  FEES,
}

export default function FundPage() {
  const params = useParams()
  const fundAddress = params.fundAddress
  const XXXFactoryContract = useXXXFactoryContract()
  const [activeNetwork] = useActiveNetworkVersion()
  const { account, chainId, provider } = useWeb3React()
  const navigate = useNavigate()
  const toggleWalletModal = useToggleWalletModal()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // theming
  const backgroundColor = useColor()
  const theme = useTheme()

  const { loading: isManagerLoading, result: [myFund] = [] } = useSingleCallResult(
    XXXFactoryContract,
    'getFundByManager',
    [account ?? undefined]
  )
  const [isManager, setIsManager] = useState<boolean>(false)
  useEffect(() => {
    if (!isManagerLoading) {
      setState()
    }
    async function setState() {
      if (myFund && fundAddress && myFund.toUpperCase() === fundAddress.toUpperCase()) {
        setIsManager(true)
      }
    }
  }, [isManagerLoading, myFund, fundAddress])

  const { loading: isInvestorLoading, result: [isSubscribed] = [] } = useSingleCallResult(
    XXXFactoryContract,
    'isSubscribed',
    [account, fundAddress]
  )
  const [isInvestor, setIsInvestor] = useState<boolean>(false)
  useEffect(() => {
    if (!isInvestorLoading) {
      setState()
    }
    async function setState() {
      if (isSubscribed) {
        setIsInvestor(true)
      }
    }
  }, [isInvestorLoading, isSubscribed, myFund])

  // token data
  const fundData = useFundData(fundAddress?.toUpperCase()).data
  const chartData = useFundChartData(fundAddress).data
  const transactions = useFundTransactions(fundAddress).data
  const investors = useFundInvestors(fundAddress).data

  const formattedVolumeETH = useMemo(() => {
    if (chartData) {
      return chartData.map((data) => {
        return {
          time: unixToDate(data.timestamp),
          volume: data.volumeETH,
          principal: data.principalUSD,
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
          time: data.timestamp,
          tokens: data.tokens,
          symbols: data.symbols,
          tokensVolumeUSD: data.tokensVolumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedFeesData = useMemo(() => {
    if (chartData) {
      return chartData.map((data) => {
        return {
          time: data.timestamp,
          feeVolumeUSD: data.feeVolumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const [view, setView] = useState(ChartView.VOL_ETH)
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()

  function onAccount(fund: string, account: string) {
    navigate('/fund')
    navigate(`/fund/${fund}/${account}`)
  }

  async function onSubscribe() {
    if (!chainId || !provider || !account || !fundAddress) return
    const { calldata, value } = XXXFactory.subscribeCallParameters(fundAddress)
    const txn: { to: string; data: string; value: string } = {
      to: XXXFACTORY_ADDRESSES,
      data: calldata,
      value,
    }
    provider
      .getSigner()
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }
        return provider
          .getSigner()
          .sendTransaction(newTxn)
          .then((response) => {
            console.log(response)
          })
      })
      .catch((error) => {
        //setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  const Buttons = () =>
    !account ? (
      <ButtonPrimary
        $borderRadius="12px"
        padding={'12px'}
        data-testid="navbar-connect-wallet"
        onClick={toggleWalletModal}
      >
        <ThemedText.DeprecatedMain mb="4px">
          <Trans>Connect Wallet</Trans>
        </ThemedText.DeprecatedMain>
      </ButtonPrimary>
    ) : (isManager || isInvestor) && fundAddress ? (
      <ButtonPrimary $borderRadius="12px" padding={'12px'} onClick={() => onAccount(fundAddress, account)}>
        <ThemedText.DeprecatedMain mb="4px">
          <Trans>My Account</Trans>
        </ThemedText.DeprecatedMain>
      </ButtonPrimary>
    ) : (
      <ButtonPrimary $borderRadius="12px" padding={'12px'} onClick={() => onSubscribe()}>
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
              <StyledInternalLink to={networkPrefix(activeNetwork) + 'fund/' + fundData.address}>
                <ThemedText.DeprecatedLabel>{`${shortenAddress(fundData.address)}`}</ThemedText.DeprecatedLabel>
              </StyledInternalLink>
            </AutoRow>
          </RowBetween>
          <ResponsiveRow align="flex-end">
            <AutoColumn gap="lg">
              <RowFixed>
                <ThemedText.DeprecatedLabel ml="8px" mr="8px" fontSize="24px">{`Fund : ${shortenAddress(
                  fundData.address
                )} `}</ThemedText.DeprecatedLabel>
                {activeNetwork === EthereumNetworkInfo ? null : <></>}
              </RowFixed>
            </AutoColumn>
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
                          {shortenAddress(fundData.manager)}
                        </ThemedText.DeprecatedLabel>
                      </RowFixed>
                    </RowBetween>
                  </AutoColumn>
                </GreyCard>
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontWeight={400}>TVL</ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="24px">
                    {formatDollarAmount(fundData.volumeUSD)}
                  </ThemedText.DeprecatedLabel>
                </AutoColumn>
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontWeight={400}>Principal</ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="24px">
                    {formatDollarAmount(fundData.principalUSD)}
                  </ThemedText.DeprecatedLabel>
                </AutoColumn>
                <AutoColumn gap="4px">
                  <ThemedText.DeprecatedMain fontWeight={400}>Ratio</ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="24px"></ThemedText.DeprecatedLabel>
                  {fundData.profitRatio.toFixed(2)}%
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
                  {isManager ? (
                    <ToggleElementFree
                      isActive={view === ChartView.FEES}
                      fontSize="12px"
                      onClick={() => (view === ChartView.FEES ? {} : setView(ChartView.FEES))}
                    >
                      Fees
                    </ToggleElementFree>
                  ) : (
                    <></>
                  )}
                </ToggleWrapper>
              </ToggleRow>
              {view === ChartView.VOL_ETH ? (
                <AreaChart
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
                ></AreaChart>
              ) : view === ChartView.VOL_USD ? (
                <AreaChart
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
                            ? formattedVolumeUSD[formattedVolumeUSD.length - 1].volume.toFixed(2)
                            : 0}
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
                    </AutoColumn>
                  }
                ></AreaChart>
              ) : view === ChartView.TOKENS ? (
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
                      <ThemedText.DeprecatedMediumHeader fontSize="16px">Tokens</ThemedText.DeprecatedMediumHeader>
                    </AutoColumn>
                  }
                ></LineChart>
              ) : isManager && view === ChartView.FEES ? (
                <AreaChart
                  data={formattedFeesData}
                  height={220}
                  minHeight={332}
                  color={activeNetwork.primaryColor}
                  value={undefined}
                  label={undefined}
                  setValue={undefined}
                  setLabel={undefined}
                  topLeft={
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMediumHeader fontSize="16px">Fees</ThemedText.DeprecatedMediumHeader>
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        <MonoSpace>
                          {'$ '}
                          {formattedFeesData && formattedFeesData[formattedFeesData.length - 1]
                            ? formattedFeesData[formattedFeesData.length - 1].feeVolumeUSD.toFixed(2)
                            : 0}
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
                    </AutoColumn>
                  }
                ></AreaChart>
              ) : (
                <></>
              )}
            </DarkGreyCard>
          </ContentLayout>
          <ThemedText.DeprecatedMain fontSize="24px">Investors</ThemedText.DeprecatedMain>
          <DarkGreyCard>{investors ? <InvestorTable investors={investors} /> : <Loader />} </DarkGreyCard>
          <ThemedText.DeprecatedMain fontSize="24px">Transactions</ThemedText.DeprecatedMain>
          <DarkGreyCard>{transactions ? <TransactionTable transactions={transactions} /> : <Loader />}</DarkGreyCard>
        </AutoColumn>
      ) : (
        <Loader />
      )}
    </PageWrapper>
  )
}
