import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import FeeBarChart from 'components/BarChart/fee'
import TokenBarChart from 'components/BarChart/token'
import VolumeBarChart from 'components/BarChart/volume'
import { ButtonPrimary } from 'components/Button'
import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import InvestorTable from 'components/funds/InvestorTable'
import { LoadingRows } from 'components/Loader/styled'
import PieChart from 'components/PieChart'
import { AutoRow, RowBetween, RowFixed, RowFlat } from 'components/Row'
import { MonoSpace } from 'components/shared'
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
import TransactionTable from 'components/TransactionsTable'
import { DOTOLI_FACTORY_ADDRESSES } from 'constants/addresses'
import { EthereumNetworkInfo } from 'constants/networks'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useFundChartData } from 'data/FundPage/chartData'
import { useFundData } from 'data/FundPage/fundData'
import { useFundInvestors } from 'data/FundPage/investors'
import { useFundTransactions } from 'data/FundPage/transactions'
import { useColor } from 'hooks/useColor'
import { useDotoliFactoryContract } from 'hooks/useContract'
import { useETHPriceInUSD, useTokensPriceInETH } from 'hooks/usePools'
import { DotoliFactory } from 'interface/DotoliFactory'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useToggleWalletModal } from 'state/application/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { StyledInternalLink, ThemedText } from 'theme'
import { shortenAddress } from 'utils'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { formatTime, unixToDate } from 'utils/date'
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

enum ChartView {
  VOL_USD,
  TOKENS,
  FEES,
}

export default function FundPage() {
  const params = useParams()
  const fundAddress = params.fundAddress
  const DotoliFactoryContract = useDotoliFactoryContract()
  const [activeNetwork] = useActiveNetworkVersion()
  const { account, chainId, provider } = useWeb3React()
  const navigate = useNavigate()
  const toggleWalletModal = useToggleWalletModal()
  const nowDate = Math.floor(new Date().getTime() / 1000)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // theming
  const backgroundColor = useColor()
  const theme = useTheme()

  const { loading: isManagerLoading, result: [myFund] = [] } = useSingleCallResult(
    DotoliFactoryContract,
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
    DotoliFactoryContract,
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

  // chart hover index
  const [volumeIndexHover, setVolumeIndexHover] = useState<number | undefined>()
  const [tokenIndexHover, setTokenIndexHover] = useState<number | undefined>()
  const [feeIndexHover, setFeeIndexHover] = useState<number | undefined>()

  const formattedVolumeUSD = useMemo(() => {
    if (chartData) {
      return chartData.map((data, index) => {
        return {
          time: data.timestamp,
          volume: data.currentUSD,
          tokens: data.currentTokens,
          symbols: data.currentTokensSymbols,
          tokensVolume: data.currentTokensAmountUSD,
          index,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedLatestTokens = useMemo(() => {
    if (fundData) {
      const fundTokenData = fundData.currentTokens.map((data, index) => {
        return {
          token: data,
          symbol: fundData.currentTokensSymbols[index],
          decimal: fundData.currentTokensDecimals[index],
          amount: fundData.currentTokensAmount[index],
          volume: fundData.currentTokensAmountUSD[index],
          index,
        }
      })
      return fundTokenData
    } else {
      return []
    }
  }, [fundData])

  const formattedFeeTokens = useMemo(() => {
    if (fundData) {
      return fundData.feeTokens.map((data, index) => {
        return {
          token: data,
          symbol: fundData.feeSymbols[index],
          amount: fundData.feeTokensAmount[index],
          index,
        }
      })
    } else {
      return []
    }
  }, [fundData])

  const weth9 = chainId ? WRAPPED_NATIVE_CURRENCY[chainId] : undefined
  const ethPriceInUSDC = useETHPriceInUSD(chainId)

  const currentTokenPools: [Token | undefined, Token | undefined, FeeAmount | undefined][] = []
  const currentTokensAmount: [Token, number][] = []
  if (formattedLatestTokens) {
    formattedLatestTokens.map((data, index) => {
      currentTokenPools.push([
        new Token(chainId ? chainId : 0, data.token, data.decimal, data.symbol),
        weth9,
        FeeAmount.HIGH,
      ])
      currentTokenPools.push([
        new Token(chainId ? chainId : 0, data.token, data.decimal, data.symbol),
        weth9,
        FeeAmount.MEDIUM,
      ])
      currentTokenPools.push([
        new Token(chainId ? chainId : 0, data.token, data.decimal, data.symbol),
        weth9,
        FeeAmount.LOW,
      ])
      currentTokensAmount.push([new Token(chainId ? chainId : 0, data.token, data.decimal, data.symbol), data.amount])
    })
  }

  const currentTokensPriceInETH = useTokensPriceInETH(chainId, currentTokenPools)

  // remove duplicated tokens and get tokens amountUSD
  // currentTokensAmount + currentTokensPriceInETH => currentTokensAmountUSD
  const currentTokensAmountUSD: [Token, number][] = []

  if (weth9 && ethPriceInUSDC && currentTokensAmount && currentTokensAmount.length > 0 && currentTokensPriceInETH) {
    for (let i = 0; i < currentTokensAmount.length; i++) {
      const newToken: Token = currentTokensAmount[i][0]
      const newTokenAddress: string = newToken.address
      const newTokenAmount: number = currentTokensAmount[i][1]
      let newTokenPriceETH = 0

      // get token's priceUSD
      for (let j = 0; j < currentTokensPriceInETH.length; j++) {
        const tokenAddress: string = currentTokensPriceInETH[j][0].address
        const tokenPriceETH: number = currentTokensPriceInETH[j][1]
        // WETH => priceETH = 1
        if (newTokenAddress.toUpperCase() === weth9.address.toUpperCase()) {
          newTokenPriceETH = 1
          break
        } else if (newTokenAddress.toUpperCase() === tokenAddress.toUpperCase()) {
          newTokenPriceETH = tokenPriceETH
          break
        }
      }

      // console.log('newTokenAddress', newTokenAddress)
      // console.log('newTokenAmount', newTokenAmount)
      // console.log('newTokenPriceETH', newTokenPriceETH)
      // console.log('ethPriceInUSDC', ethPriceInUSDC)

      // sum duplicated token's amountUSD
      let isAdded = false
      for (let j = 0; j < currentTokensAmountUSD.length; j++) {
        const filteredTokenAddress: string = currentTokensAmountUSD[j][0].address
        if (newTokenAddress.toUpperCase() === filteredTokenAddress.toUpperCase()) {
          currentTokensAmountUSD[j][1] += newTokenAmount * newTokenPriceETH * ethPriceInUSDC
          isAdded = true
          break
        }
      }
      if (!isAdded) {
        currentTokensAmountUSD.push([newToken, newTokenAmount * newTokenPriceETH * ethPriceInUSDC])
      }
    }
  }

  if (formattedVolumeUSD && formattedVolumeUSD.length > 0) {
    let totalCurrentAmountUSD = 0
    currentTokensAmountUSD.map((value, index) => {
      const tokenAmountUSD = value[1]
      totalCurrentAmountUSD += tokenAmountUSD
    })
    formattedVolumeUSD.push({
      time: nowDate,
      volume: totalCurrentAmountUSD,
      tokens: formattedVolumeUSD[formattedVolumeUSD.length - 1].tokens,
      symbols: formattedVolumeUSD[formattedVolumeUSD.length - 1].symbols,
      tokensVolume: formattedVolumeUSD[formattedVolumeUSD.length - 1].tokensVolume,
      index: formattedVolumeUSD.length,
    })
  }

  const volumeChartHoverIndex = volumeIndexHover !== undefined ? volumeIndexHover : undefined

  const formattedHoverToken = useMemo(() => {
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
      return undefined
    }
  }, [volumeChartHoverIndex, formattedVolumeUSD])

  function onAccount(fund: string, account: string) {
    navigate(`/fund/${fund}/${account}`)
  }

  async function onSubscribe() {
    if (!chainId || !provider || !account || !fundAddress) return
    const { calldata, value } = DotoliFactory.subscribeCallParameters(fundAddress)
    const txn: { to: string; data: string; value: string } = {
      to: DOTOLI_FACTORY_ADDRESSES,
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
                <ThemedText.DeprecatedMain>
                  <Trans>Home</Trans>
                  {' > '}
                </ThemedText.DeprecatedMain>
              </StyledInternalLink>
              <StyledInternalLink to={networkPrefix(activeNetwork) + 'funds'}>
                <ThemedText.DeprecatedLabel>
                  <Trans>Funds</Trans>
                </ThemedText.DeprecatedLabel>
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
                <ThemedText.DeprecatedLabel ml="8px" mr="8px" fontSize="24px">
                  <Trans>Fund :</Trans> ${shortenAddress(fundData.address)}
                </ThemedText.DeprecatedLabel>
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
                  <ThemedText.DeprecatedMain ml="8px">
                    <Trans>Manager</Trans> :{' '}
                  </ThemedText.DeprecatedMain>
                  <ThemedText.DeprecatedLabel fontSize="14px" ml="8px">
                    {shortenAddress(fundData.manager)}
                  </ThemedText.DeprecatedLabel>
                </AutoRow>
                <PieChart
                  data={formattedHoverToken ? formattedHoverToken : formattedLatestTokens}
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
                    <Trans>Volume</Trans>
                  </ToggleElement>
                  <ToggleElement
                    isActive={view === ChartView.TOKENS}
                    fontSize="12px"
                    onClick={() => (view === ChartView.TOKENS ? {} : setView(ChartView.TOKENS))}
                  >
                    <Trans>Tokens</Trans>
                  </ToggleElement>
                  {isManager ? (
                    <ToggleElement
                      isActive={view === ChartView.FEES}
                      fontSize="12px"
                      onClick={() => (view === ChartView.FEES ? {} : setView(ChartView.FEES))}
                    >
                      <Trans>Fees</Trans>
                    </ToggleElement>
                  ) : (
                    <></>
                  )}
                </ToggleWrapper>
              </ToggleRow>
              {view === ChartView.VOL_USD ? (
                <VolumeBarChart
                  data={formattedVolumeUSD}
                  color={activeNetwork.primaryColor}
                  setIndex={setVolumeIndexHover}
                  topLeft={
                    <AutoColumn gap="4px">
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        <MonoSpace>
                          {formatDollarAmount(
                            volumeIndexHover !== undefined && formattedVolumeUSD && formattedVolumeUSD.length > 0
                              ? formattedVolumeUSD[volumeIndexHover].volume
                              : formattedVolumeUSD && formattedVolumeUSD.length > 0
                              ? formattedVolumeUSD[formattedVolumeUSD.length - 1].volume
                              : 0
                          )}
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
                    </AutoColumn>
                  }
                  topRight={
                    <AutoColumn gap="4px" justify="end">
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
                        <ThemedText.DeprecatedMediumHeader fontSize="16px">
                          {tokenIndexHover !== undefined && formattedLatestTokens && formattedLatestTokens.length > 0
                            ? formattedLatestTokens[tokenIndexHover].symbol
                            : formattedLatestTokens && formattedLatestTokens.length > 0
                            ? formattedLatestTokens[0].symbol
                            : null}
                          &nbsp;&nbsp;
                        </ThemedText.DeprecatedMediumHeader>
                        {tokenIndexHover !== undefined && formattedLatestTokens && formattedLatestTokens.length > 0 ? (
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
                        <MonoSpace>
                          {tokenIndexHover !== undefined && formattedLatestTokens && formattedLatestTokens.length > 0
                            ? formattedLatestTokens[tokenIndexHover].amount
                            : formattedLatestTokens && formattedLatestTokens.length > 0
                            ? formattedLatestTokens[0].amount
                            : null}
                          <br />
                        </MonoSpace>
                      </ThemedText.DeprecatedLargeHeader>
                    </AutoColumn>
                  }
                  topRight={
                    <AutoColumn gap="4px" justify="end">
                      <ThemedText.DeprecatedMain fontSize="14px">
                        <MonoSpace>
                          {unixToDate(nowDate)} ({formatTime(nowDate.toString(), 8)})
                        </MonoSpace>
                      </ThemedText.DeprecatedMain>
                      <ThemedText.DeprecatedLargeHeader fontSize="30px">
                        {tokenIndexHover !== undefined && formattedLatestTokens && formattedLatestTokens.length > 0
                          ? formatDollarAmount(formattedLatestTokens[tokenIndexHover].volume)
                          : formattedLatestTokens && formattedLatestTokens.length > 0
                          ? formatDollarAmount(formattedLatestTokens[0].volume)
                          : null}
                        <br />
                      </ThemedText.DeprecatedLargeHeader>
                    </AutoColumn>
                  }
                />
              ) : isManager && view === ChartView.FEES ? (
                <FeeBarChart
                  data={formattedFeeTokens}
                  color={activeNetwork.primaryColor}
                  setIndex={setFeeIndexHover}
                  topLeft={
                    <AutoColumn gap="4px">
                      <AutoRow>
                        <ThemedText.DeprecatedMediumHeader fontSize="16px">
                          {feeIndexHover !== undefined && formattedFeeTokens && formattedFeeTokens.length > 0
                            ? formattedFeeTokens[feeIndexHover].symbol
                            : formattedFeeTokens && formattedFeeTokens.length > 0
                            ? formattedFeeTokens[0].symbol
                            : null}
                          &nbsp;&nbsp;
                        </ThemedText.DeprecatedMediumHeader>
                        <ThemedText.DeprecatedMain fontSize="14px">
                          {feeIndexHover !== undefined && formattedFeeTokens && formattedFeeTokens.length > 0 ? (
                            <MonoSpace>{shortenAddress(formattedFeeTokens[feeIndexHover].token)}</MonoSpace>
                          ) : formattedFeeTokens && formattedFeeTokens.length > 0 ? (
                            <MonoSpace>{shortenAddress(formattedFeeTokens[0].token)}</MonoSpace>
                          ) : null}
                        </ThemedText.DeprecatedMain>
                      </AutoRow>
                      <ThemedText.DeprecatedLargeHeader fontSize="32px">
                        <MonoSpace>
                          {feeIndexHover !== undefined && formattedFeeTokens && formattedFeeTokens.length > 0 ? (
                            formattedFeeTokens[feeIndexHover].amount
                          ) : formattedFeeTokens && formattedFeeTokens.length > 0 ? (
                            formattedFeeTokens[0].amount
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
                      <ThemedText.DeprecatedMain fontSize="14px">
                        <MonoSpace>
                          {unixToDate(nowDate)} ({formatTime(nowDate.toString(), 8)})
                        </MonoSpace>
                      </ThemedText.DeprecatedMain>
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
            <Trans>Investors</Trans>
          </ThemedText.DeprecatedMain>
          <DarkGreyCard>
            {investors ? (
              <InvestorTable investors={investors} />
            ) : (
              <LoadingRows>
                <div />
              </LoadingRows>
            )}{' '}
          </DarkGreyCard>
          <ThemedText.DeprecatedMain mt={'16px'} fontSize="22px">
            <Trans>Transactions</Trans>
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
        </AutoColumn>
      ) : (
        <LoadingRows>
          <div />
        </LoadingRows>
      )}
    </PageWrapper>
  )
}
