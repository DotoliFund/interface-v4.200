import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { ButtonGray, ButtonPrimary } from 'components/Button'
import { DarkGreyCard, GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import InvestorTable from 'components/funds/InvestorTable'
import LineChart from 'components/LineChart/alt'
import Loader from 'components/Loader'
import Percent from 'components/Percent'
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
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { unixToDate } from 'utils/date'
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
  const fundData = useFundData(fundAddress).data
  const chartData = useFundChartData(fundAddress).data
  const transactions = useFundTransactions(fundAddress).data
  const investors = useFundInvestors(fundAddress).data
  console.log(investors)

  const formattedVolumeETHData = useMemo(() => {
    if (chartData) {
      return chartData.map((data) => {
        return {
          time: unixToDate(data.timestamp),
          value: [data.volumeETH, data.principalETH],
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedVolumeUSDData = useMemo(() => {
    if (chartData) {
      return chartData.map((data) => {
        return {
          time: unixToDate(data.timestamp),
          value: [data.volumeUSD, data.principalUSD],
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
      <ButtonPrimary $borderRadius="12px" padding={'12px'}>
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
                  <ToggleElementFree
                    isActive={view === ChartView.FEES}
                    fontSize="12px"
                    onClick={() => (view === ChartView.FEES ? {} : setView(ChartView.FEES))}
                  >
                    Fees
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
                  data={formattedVolumeETHData}
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
                      <ThemedText.DeprecatedMain fontSize="12px" height="14px">
                        <MonoSpace>left label (UTC)</MonoSpace>
                      </ThemedText.DeprecatedMain>
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
                  data={formattedVolumeUSDData}
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
                      <ThemedText.DeprecatedMain fontSize="12px" height="14px">
                        <MonoSpace>left label (UTC)</MonoSpace>
                      </ThemedText.DeprecatedMain>
                    </AutoColumn>
                  }
                ></LineChart>
              ) : view === ChartView.TOKENS ? (
                <LineChart
                  data={formattedVolumeETHData}
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
                      <ThemedText.DeprecatedMain fontSize="12px" height="14px">
                        <MonoSpace>left label (UTC)</MonoSpace>
                      </ThemedText.DeprecatedMain>
                    </AutoColumn>
                  }
                ></LineChart>
              ) : (
                <LineChart
                  data={formattedVolumeUSDData}
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
                      <ThemedText.DeprecatedMain fontSize="12px" height="14px">
                        <MonoSpace>left label (UTC)</MonoSpace>
                      </ThemedText.DeprecatedMain>
                    </AutoColumn>
                  }
                ></LineChart>
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
