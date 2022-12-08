import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import AreaChart from 'components/AreaChart'
import MultiAreaChart from 'components/AreaChart/principal'
import { ButtonPrimary } from 'components/Button'
import { DarkGreyCard } from 'components/Card'
import Card from 'components/Card'
import { AutoColumn } from 'components/Column'
import InvestorTable from 'components/funds/InvestorTable'
import Loader from 'components/Loader'
import PieChart from 'components/PieChart'
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
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useToggleWalletModal } from 'state/application/hooks'
import styled from 'styled-components/macro'
import { StyledInternalLink, ThemedText } from 'theme'
import { shortenAddress } from 'utils'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { unixToDate } from 'utils/date'
import { networkPrefix } from 'utils/networkPrefix'
import { formatAmount } from 'utils/numbers'

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

  const [view, setView] = useState(ChartView.VOL_ETH)
  const [valueLabel, setValueLabel] = useState<string | undefined>()
  const [volumeETHHover, setVolumeETHHover] = useState<number | undefined>()
  const [principalHover, setPrincipalHover] = useState<number | undefined>()
  const [tokensHover, setTokensHover] = useState<string[] | undefined>()
  const [symbolsHover, setSymbolsHover] = useState<string[] | undefined>()
  const [tokensVolumeUSDHover, setTokensVolumeUSDHover] = useState<number[] | undefined>()

  const formattedVolumeETH = useMemo(() => {
    if (chartData) {
      return chartData.map((data) => {
        return {
          time: unixToDate(data.timestamp),
          volume: data.volumeETH,
          principal: data.principalETH,
          tokens: data.tokens,
          symbols: data.symbols,
          tokensVolume: data.tokensVolumeETH,
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
    if (formattedVolumeETH && formattedVolumeETH[formattedVolumeETH.length - 1]) {
      const latestVolumeETH = formattedVolumeETH[formattedVolumeETH.length - 1]
      return latestVolumeETH.tokens.map((data, index) => {
        return {
          token: data,
          symbol: latestVolumeETH.symbols[index],
          tokenVolume: latestVolumeETH.tokensVolume[index],
        }
      })
    } else {
      return []
    }
  }, [formattedVolumeETH])

  const latestVolumeData = useMemo(() => {
    if (formattedVolumeETH && formattedVolumeETH[formattedVolumeETH.length - 1]) {
      const latestVolumeETH = formattedVolumeETH[formattedVolumeETH.length - 1]
      return {
        volume: latestVolumeETH.volume,
        principal: latestVolumeETH.principal,
      }
    } else {
      return undefined
    }
  }, [formattedVolumeETH])

  const formattedFeesData = useMemo(() => {
    if (chartData) {
      return chartData.map((data) => {
        return {
          time: data.timestamp,
          value: data.feeVolumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

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
                <AutoRow gap="md">
                  <ThemedText.DeprecatedMain>Manager</ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="14px" ml="8px">
                    {shortenAddress(fundData.manager)}
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
                        {formatAmount(volumeETHHover ? volumeETHHover : latestVolumeData ? latestVolumeData.volume : 0)}
                      </ThemedText.DeprecatedLabel>
                    </AutoColumn>
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMain fontWeight={400}>Principal</ThemedText.DeprecatedMain>
                      <ThemedText.DeprecatedLabel fontSize="24px">
                        {formatAmount(
                          principalHover ? principalHover : latestVolumeData ? latestVolumeData.principal : 0
                        )}
                      </ThemedText.DeprecatedLabel>
                    </AutoColumn>
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMain fontWeight={400}>Ratio</ThemedText.DeprecatedMain>
                      <ThemedText.DeprecatedLabel fontSize="24px">
                        {volumeETHHover && principalHover && principalHover > 0
                          ? ((volumeETHHover - principalHover) / principalHover).toFixed(2)
                          : 0}
                        %
                      </ThemedText.DeprecatedLabel>
                    </AutoColumn>
                  </RowBetween>
                </PieWrapper>
              </AutoColumn>
            </DarkGreyCard>
            <DarkGreyCard>
              <ToggleRow align="flex-start">
                <AutoColumn>
                  <ThemedText.DeprecatedMain paddingY="20px" fontSize="12px"></ThemedText.DeprecatedMain>
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
                <MultiAreaChart
                  data={formattedVolumeETH}
                  height={220}
                  minHeight={332}
                  color={activeNetwork.primaryColor}
                  value={volumeETHHover}
                  label={valueLabel}
                  setValue={setVolumeETHHover}
                  setLabel={setValueLabel}
                  setPrincipal={setPrincipalHover}
                  setTokens={setTokensHover}
                  setSymbols={setSymbolsHover}
                  setTokensVolumeUSD={setTokensVolumeUSDHover}
                  topLeft={
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMediumHeader fontSize="16px">TVL</ThemedText.DeprecatedMediumHeader>
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        <MonoSpace>
                          {volumeETHHover
                            ? volumeETHHover.toFixed(4)
                            : formattedVolumeETH && formattedVolumeETH[formattedVolumeETH.length - 1]
                            ? formattedVolumeETH[formattedVolumeETH.length - 1].volume.toFixed(4)
                            : 0}
                          {' ETH'}
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
                      <ThemedText.DeprecatedMain fontSize="12px" height="14px">
                        {valueLabel ? <MonoSpace>{valueLabel} (UTC)</MonoSpace> : null}
                      </ThemedText.DeprecatedMain>
                    </AutoColumn>
                  }
                />
              ) : view === ChartView.VOL_USD ? (
                <MultiAreaChart
                  data={formattedVolumeUSD}
                  height={220}
                  minHeight={332}
                  color={activeNetwork.primaryColor}
                  value={volumeETHHover}
                  label={valueLabel}
                  setValue={setVolumeETHHover}
                  setLabel={setValueLabel}
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
                          {volumeETHHover
                            ? volumeETHHover.toFixed(2)
                            : formattedVolumeUSD && formattedVolumeUSD[formattedVolumeUSD.length - 1]
                            ? formattedVolumeUSD[formattedVolumeUSD.length - 1].volume.toFixed(2)
                            : 0}
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
                      <ThemedText.DeprecatedMain fontSize="12px" height="14px">
                        {valueLabel ? <MonoSpace>{valueLabel} (UTC)</MonoSpace> : null}
                      </ThemedText.DeprecatedMain>
                    </AutoColumn>
                  }
                />
              ) : isManager && view === ChartView.FEES ? (
                <AreaChart
                  data={formattedFeesData}
                  height={220}
                  minHeight={332}
                  color={activeNetwork.primaryColor}
                  value={volumeETHHover}
                  label={valueLabel}
                  setValue={setVolumeETHHover}
                  setLabel={setValueLabel}
                  topLeft={
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedMediumHeader fontSize="16px">Fees</ThemedText.DeprecatedMediumHeader>
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        <MonoSpace>
                          {'$ '}
                          {volumeETHHover
                            ? volumeETHHover.toFixed(2)
                            : formattedFeesData && formattedFeesData[formattedFeesData.length - 1]
                            ? formattedFeesData[formattedFeesData.length - 1].value.toFixed(2)
                            : 0}
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
                      <ThemedText.DeprecatedMain fontSize="12px" height="14px">
                        {valueLabel ? <MonoSpace>{valueLabel} (UTC)</MonoSpace> : null}
                      </ThemedText.DeprecatedMain>
                    </AutoColumn>
                  }
                />
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
