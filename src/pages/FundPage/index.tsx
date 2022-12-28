import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import BarChart from 'components/BarChart'
import FeeBarChart from 'components/BarChart/fee'
import { ButtonPrimary } from 'components/Button'
import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import ComposedChart from 'components/ComposedChart'
import InvestorTable from 'components/funds/InvestorTable'
import Loader from 'components/Loader'
import Percent from 'components/Percent'
import PieChart from 'components/PieChart'
import { AutoRow, RowBetween, RowFixed, RowFlat } from 'components/Row'
import { MonoSpace } from 'components/shared'
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
import TransactionTable from 'components/TransactionsTable'
import { XXXFACTORY_ADDRESSES } from 'constants/addresses'
import { EthereumNetworkInfo } from 'constants/networks'
import { useFundChartData } from 'data/FundPage/chartData'
import { useFundData } from 'data/FundPage/fundData'
import { useFundInvestors } from 'data/FundPage/investors'
import { useFundTransactions } from 'data/FundPage/transactions'
import { useColor } from 'hooks/useColor'
import { useXXXFactoryContract } from 'hooks/useContract'
import { XXXFactory } from 'interface/XXXFactory'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useEffect, useMemo, useState } from 'react'
import { BarChart as BarChartIcon, PieChart as PieChartIcon } from 'react-feather'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useToggleWalletModal } from 'state/application/hooks'
import styled, { css, useTheme } from 'styled-components/macro'
import { StyledInternalLink, ThemedText } from 'theme'
import { shortenAddress } from 'utils'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { unixToDate } from 'utils/date'
import { formatTime } from 'utils/date'
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

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`

const BarChartIconComponent = styled(BarChartIcon)`
  ${IconStyle}
`

const PieChartIconComponent = styled(PieChartIcon)`
  ${IconStyle}
`

enum ChartView {
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
      } else {
        setIsManager(false)
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
      } else {
        setIsInvestor(false)
      }
    }
  }, [isInvestorLoading, isSubscribed, myFund])

  // token data
  const fundData = useFundData(fundAddress).data
  const chartData = useFundChartData(fundAddress).data
  const transactions = useFundTransactions(fundAddress).data
  const investors = useFundInvestors(fundAddress).data

  const [view, setView] = useState(ChartView.VOL_USD)

  // Composed chart hover
  const [dateHover, setDateHover] = useState<string | undefined>()
  const [volumeHover, setVolumeHover] = useState<number | undefined>()
  const [liquidityHover, setLiquidityHover] = useState<number>()
  const [principalHover, setPrincipalHover] = useState<number | undefined>()
  const [tokensHover, setTokensHover] = useState<string[] | undefined>()
  const [symbolsHover, setSymbolsHover] = useState<string[] | undefined>()
  const [tokensVolumeUSDHover, setTokensVolumeUSDHover] = useState<number[] | undefined>()
  // Bar chart hover
  const [tokenVolumeHover, setTokenVolumeHover] = useState<number | undefined>()
  const [tokenSymbolHover, setTokenSymbolHover] = useState<string | undefined>()
  const [tokenAddressHover, setTokenAddressHover] = useState<string | undefined>()
  const [tokenAmountHover, setTokenAmountHover] = useState<number | undefined>()
  const [feeTokenAmountHover, setFeeTokenAmountHover] = useState<number | undefined>()

  const formattedVolumeUSD = useMemo(() => {
    if (chartData) {
      return chartData.map((data) => {
        return {
          time: data.timestamp,
          volume: data.volumeUSD,
          principal: data.principalUSD,
          tokens: data.tokens,
          symbols: data.symbols,
          tokensVolume: data.tokensVolumeUSD,
          liquidityVolume: data.liquidityVolumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedHoverData = useMemo(() => {
    if (chartData && tokensHover && symbolsHover && tokensVolumeUSDHover) {
      const hoverData = tokensHover.map((data, index) => {
        return {
          token: data,
          symbol: symbolsHover[index],
          tokenVolume: tokensVolumeUSDHover[index],
        }
      })
      if (liquidityHover && liquidityHover > 0) {
        hoverData.push({
          token: 'Liquidity',
          symbol: 'Liquidity',
          tokenVolume: liquidityHover,
        })
      }
      return hoverData
    } else {
      return undefined
    }
  }, [chartData, tokensHover, symbolsHover, liquidityHover, tokensVolumeUSDHover])

  const formattedLatestTokensData = useMemo(() => {
    if (fundData) {
      const fundTokenData = fundData.tokens.map((data, index) => {
        return {
          token: data,
          symbol: fundData.symbols[index],
          amount: fundData.tokensAmount[index],
          tokenVolume: fundData.tokensVolumeUSD[index],
        }
      })
      if (fundData.liquidityVolumeUSD > 0) {
        fundTokenData.push({
          token: 'Liquidity',
          symbol: 'Liquidity',
          amount: 0,
          tokenVolume: fundData.liquidityVolumeUSD,
        })
      }
      return fundTokenData
    } else {
      return []
    }
  }, [fundData])

  const latestVolumeData = useMemo(() => {
    if (fundData && chartData && chartData.length > 0) {
      return {
        time: chartData[chartData.length - 1].timestamp,
        volume: fundData.volumeUSD,
        liquidityVolume: chartData[chartData.length - 1].liquidityVolumeUSD,
        principal: fundData.principalUSD,
      }
    } else {
      return undefined
    }
  }, [fundData, chartData])

  const formattedFeesData = useMemo(() => {
    if (fundData) {
      return fundData.feeTokens.map((data, index) => {
        return {
          token: data,
          symbol: fundData.feeSymbols[index],
          amount: fundData.feeTokensAmount[index],
        }
      })
    } else {
      return []
    }
  }, [fundData])

  const ratio = useMemo(() => {
    return volumeHover !== undefined &&
      liquidityHover !== undefined &&
      principalHover !== undefined &&
      principalHover > 0
      ? Number((((volumeHover + liquidityHover - principalHover) / principalHover) * 100).toFixed(2))
      : principalHover === 0
      ? Number(0)
      : latestVolumeData && latestVolumeData.principal > 0
      ? Number(
          (
            ((latestVolumeData.volume + latestVolumeData.liquidityVolume - latestVolumeData.principal) /
              latestVolumeData.principal) *
            100
          ).toFixed(2)
        )
      : Number(0)
  }, [volumeHover, liquidityHover, principalHover, latestVolumeData])

  function onAccount(fund: string, account: string) {
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

  const ButtonA = () =>
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
    ) : (isManager || isInvestor) && fundAddress ? (
      <ButtonPrimary
        $borderRadius="12px"
        margin={'6px'}
        padding={'12px'}
        onClick={() => onAccount(fundAddress, account)}
      >
        <ThemedText.DeprecatedMain mb="4px">
          <Trans>My Account</Trans>
        </ThemedText.DeprecatedMain>
      </ButtonPrimary>
    ) : (
      <ButtonPrimary $borderRadius="12px" margin={'6px'} padding={'12px'} onClick={() => onSubscribe()}>
        <ThemedText.DeprecatedMain mb="4px">
          <Trans>Subscribe</Trans>
        </ThemedText.DeprecatedMain>
      </ButtonPrimary>
    )

  const ButtonB = () =>
    account && isManager && fundAddress ? (
      <ButtonPrimary
        $borderRadius="12px"
        margin={'6px'}
        padding={'12px'}
        data-testid="navbar-connect-wallet"
        onClick={() => {
          navigate(`/fee/${fundAddress}`)
        }}
      >
        <ThemedText.DeprecatedMain mb="4px">
          <Trans>Fee</Trans>
        </ThemedText.DeprecatedMain>
      </ButtonPrimary>
    ) : null

  return (
    <PageWrapper>
      <ThemedBackground backgroundColor={backgroundColor} />
      {fundData ? (
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
                <ButtonA />
                <ButtonB />
              </RowFixed>
            )}
          </ResponsiveRow>
          <ContentLayout>
            <DarkGreyCard>
              <AutoColumn gap="md">
                <AutoRow gap="md">
                  <ThemedText.DeprecatedMain ml="8px">Manager : </ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="14px" ml="8px">
                    {shortenAddress(fundData.manager)}
                  </ThemedText.DeprecatedLabel>
                </AutoRow>
                <PieChart
                  data={formattedHoverData ? formattedHoverData : formattedLatestTokensData}
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
                  {isManager ? (
                    <ToggleElement
                      isActive={view === ChartView.FEES}
                      fontSize="12px"
                      onClick={() => (view === ChartView.FEES ? {} : setView(ChartView.FEES))}
                    >
                      Fees
                    </ToggleElement>
                  ) : (
                    <></>
                  )}
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
                              ? latestVolumeData.volume + latestVolumeData.liquidityVolume
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
                              volumeHover !== undefined ? volumeHover : latestVolumeData ? latestVolumeData.volume : 0
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
                                ? latestVolumeData.liquidityVolume
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
                                ? latestVolumeData.principal
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
                  topLeft={
                    <AutoColumn gap="4px">
                      <AutoRow>
                        <ThemedText.DeprecatedMediumHeader fontSize="16px">
                          {tokenSymbolHover ? tokenSymbolHover : null}
                          &nbsp;&nbsp;
                        </ThemedText.DeprecatedMediumHeader>
                        {tokenAddressHover === 'Liquidity' ? null : tokenAddressHover ? (
                          <ThemedText.DeprecatedMain fontSize="14px">
                            <Link to={'https://www.guru99.com/c-function-pointers.html'}>
                              <MonoSpace>{shortenAddress(tokenAddressHover)}</MonoSpace>
                            </Link>
                          </ThemedText.DeprecatedMain>
                        ) : null}
                      </AutoRow>
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        <MonoSpace>
                          {tokenAddressHover && tokenAddressHover !== 'Liquidity' ? (
                            tokenAmountHover
                          ) : (
                            <>
                              <br />
                            </>
                          )}
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
                    </AutoColumn>
                  }
                  topRight={
                    <AutoColumn gap="4px" justify="end">
                      {latestVolumeData ? (
                        <ThemedText.DeprecatedMain fontSize="14px">
                          <MonoSpace>
                            {unixToDate(latestVolumeData.time)} ( {formatTime(latestVolumeData.time.toString(), 8)})
                          </MonoSpace>
                        </ThemedText.DeprecatedMain>
                      ) : null}
                      <ThemedText.DeprecatedLargeHeader fontSize="30px">
                        {tokenVolumeHover ? (
                          <MonoSpace>{formatDollarAmount(tokenVolumeHover)}</MonoSpace>
                        ) : (
                          <>
                            <br />
                          </>
                        )}
                      </ThemedText.DeprecatedLargeHeader>
                    </AutoColumn>
                  }
                />
              ) : isManager && view === ChartView.FEES ? (
                <FeeBarChart
                  data={formattedFeesData}
                  color={activeNetwork.primaryColor}
                  setLabel={setTokenAddressHover}
                  setSymbol={setTokenSymbolHover}
                  setValue={setFeeTokenAmountHover}
                  topLeft={
                    <AutoColumn gap="4px">
                      <AutoRow>
                        <ThemedText.DeprecatedMediumHeader fontSize="16px">
                          {tokenSymbolHover ? tokenSymbolHover : null}
                          &nbsp;&nbsp;
                        </ThemedText.DeprecatedMediumHeader>
                        {tokenAddressHover === 'Liquidity' ? null : tokenAddressHover ? (
                          <ThemedText.DeprecatedMain fontSize="14px">
                            <Link to={'https://www.guru99.com/c-function-pointers.html'}>
                              <MonoSpace>{shortenAddress(tokenAddressHover)}</MonoSpace>
                            </Link>
                          </ThemedText.DeprecatedMain>
                        ) : null}
                      </AutoRow>
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        <MonoSpace>
                          {tokenAddressHover && tokenAddressHover !== 'Liquidity' ? (
                            feeTokenAmountHover
                          ) : (
                            <>
                              <br />
                            </>
                          )}
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
                    </AutoColumn>
                  }
                  topRight={
                    <AutoColumn gap="4px" justify="end">
                      {latestVolumeData ? (
                        <ThemedText.DeprecatedMain fontSize="14px">
                          <MonoSpace>
                            {unixToDate(latestVolumeData.time)} ( {formatTime(latestVolumeData.time.toString(), 8)})
                          </MonoSpace>
                        </ThemedText.DeprecatedMain>
                      ) : null}
                      <ThemedText.DeprecatedLargeHeader fontSize="30px">
                        <>
                          <br />
                        </>
                      </ThemedText.DeprecatedLargeHeader>
                    </AutoColumn>
                  }
                />
              ) : null}
            </DarkGreyCard>
          </ContentLayout>
          <ThemedText.DeprecatedMain mt={'16px'} fontSize="22px">
            Investors
          </ThemedText.DeprecatedMain>
          <DarkGreyCard>{investors ? <InvestorTable investors={investors} /> : <Loader />} </DarkGreyCard>
          <ThemedText.DeprecatedMain mt={'16px'} fontSize="22px">
            Transactions
          </ThemedText.DeprecatedMain>
          <DarkGreyCard>{transactions ? <TransactionTable transactions={transactions} /> : <Loader />}</DarkGreyCard>
        </AutoColumn>
      ) : (
        <Loader />
      )}
    </PageWrapper>
  )
}
