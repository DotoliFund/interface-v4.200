import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import FeeBarChart from 'components/BarChart/fee'
import TokenBarChart from 'components/BarChart/token'
import VolumeBarChart from 'components/BarChart/volume'
import { ButtonYellow } from 'components/Button'
import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { LoadingRows } from 'components/Loader/styled'
import PieChart from 'components/PieChart'
import { AutoRow, RowBetween, RowFixed, RowFlat } from 'components/Row'
import { MonoSpace } from 'components/shared'
import InvestorTable from 'components/Tables/InvestorTable'
import ManagerTable from 'components/Tables/ManagerTable'
import TransactionTable from 'components/Tables/TransactionTable'
import { ToggleElement, ToggleWrapper } from 'components/Toggle/MultiToggle'
import { DOTOLI_INFO_ADDRESSES } from 'constants/addresses'
import { isSupportedChain } from 'constants/chains'
import { EthereumNetworkInfo } from 'constants/networks'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useFundData } from 'data/FundPage/fundData'
import { useInvestors } from 'data/FundPage/investors'
import { useManagerData } from 'data/FundPage/managerData'
import { useFundTransactions } from 'data/FundPage/transactions'
import { useVolumeChartData } from 'data/FundPage/volumeChartData'
import { useColor } from 'hooks/useColor'
import { useDotoliInfoContract } from 'hooks/useContract'
import { useETHPriceInUSD, useTokensPriceInUSD } from 'hooks/usePools'
import { DotoliInfo } from 'interface/DotoliInfo'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { ErrorContainer, NetworkIcon } from 'pages/Account'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ClipLoader from 'react-spinners/ClipLoader'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useToggleWalletModal } from 'state/application/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { getEtherscanLink, shortenAddress } from 'utils'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { formatTime, unixToDate } from 'utils/date'
import { formatAmount, formatDollarAmount } from 'utils/numbers'

import { TransactionType } from '../../state/transactions/types'

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

const PieChartWrapper = styled(DarkGreyCard)`
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`

const ChartWrapper = styled(DarkGreyCard)`
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
`

enum ChartView {
  CURRENT_ASSET_TOKENS,
  TOKENS,
  FEES,
}

export default function FundPage() {
  const params = useParams()
  const currentPageFund = params.fundId
  const DotoliInfoContract = useDotoliInfoContract()
  const [activeNetwork] = useActiveNetworkVersion()
  const { account, chainId, provider } = useWeb3React()
  const navigate = useNavigate()
  const toggleWalletModal = useToggleWalletModal()
  const nowDate = Math.floor(new Date().getTime() / 1000)
  const theme = useTheme()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // theming
  const backgroundColor = useColor()

  const { loading: myManagingFundLoading, result: [myManagingFund] = [] } = useSingleCallResult(
    DotoliInfoContract,
    'managingFund',
    [account ?? undefined]
  )
  const [userIsManager, setUserIsManager] = useState<boolean>(false)
  useEffect(() => {
    if (!myManagingFundLoading) {
      setState()
    }
    async function setState() {
      if (myManagingFund && currentPageFund && myManagingFund.toString() === currentPageFund.toString()) {
        setUserIsManager(true)
      } else {
        setUserIsManager(false)
      }
    }
  }, [myManagingFundLoading, myManagingFund, currentPageFund])

  const { loading: isSubscribedLoading, result: [isSubscribed] = [] } = useSingleCallResult(
    DotoliInfoContract,
    'isSubscribed',
    [account, currentPageFund]
  )
  const [userIsInvestor, setUserIsInvestor] = useState<boolean>(false)
  useEffect(() => {
    if (!isSubscribedLoading) {
      setState()
    }
    async function setState() {
      if (isSubscribed) {
        setUserIsInvestor(true)
      } else {
        setUserIsInvestor(false)
      }
    }
  }, [isSubscribedLoading, isSubscribed])

  const fundData = useFundData(currentPageFund).data
  const volumeChartData = useVolumeChartData(currentPageFund).data
  const transactions = useFundTransactions(currentPageFund).data
  const managerData = useManagerData(currentPageFund).data
  const investors = useInvestors(currentPageFund).data

  const [view, setView] = useState(ChartView.CURRENT_ASSET_TOKENS)

  // chart hover index
  const [volumeIndexHover, setVolumeIndexHover] = useState<number | undefined>()
  const [tokenIndexHover, setTokenIndexHover] = useState<number | undefined>()
  const [feeIndexHover, setFeeIndexHover] = useState<number | undefined>()

  const formattedVolumeUSD = useMemo(() => {
    if (volumeChartData) {
      return volumeChartData.map((data, index) => {
        return {
          time: data.timestamp,
          current: data.currentUSD,
          tokens: data.currentTokens,
          symbols: data.currentTokensSymbols,
          tokensVolume: data.currentTokensAmountUSD,
          index,
        }
      })
    } else {
      return []
    }
  }, [volumeChartData])

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

  const currentTokensAmount = useMemo(() => {
    if (chainId && fundData) {
      return fundData.currentTokens.map((data, index) => {
        const decimals = fundData.currentTokensDecimals[index]
        const symbol = fundData.currentTokensSymbols[index]
        const token = new Token(chainId, data, decimals, symbol)
        const decimal = 10 ** decimals
        return CurrencyAmount.fromRawAmount(token, Math.floor(fundData.currentTokensAmount[index] * decimal))
      })
    } else {
      return []
    }
  }, [chainId, fundData])

  const currentTokensAmountUSD: [CurrencyAmount<Token>, number][] = useTokensPriceInUSD(
    chainId,
    weth9,
    ethPriceInUSDC,
    currentTokensAmount
  )

  const formattedLatestTokens = useMemo(() => {
    if (currentTokensAmountUSD) {
      const tokensData = currentTokensAmountUSD.map((data, index) => {
        const token = data[0].currency
        const tokenAddress = token.address
        const symbol = token.symbol ? token.symbol : 'Unknown'
        const decimal = token.decimals
        const amount = Number(data[0].quotient.toString()) / Number(10 ** decimal)
        const amountUSD = data[1]
        return {
          token: tokenAddress,
          symbol,
          decimal,
          amount,
          volume: amountUSD,
          index,
        }
      })
      return tokensData
    } else {
      return []
    }
  }, [currentTokensAmountUSD])

  if (
    formattedVolumeUSD &&
    formattedVolumeUSD.length > 1 &&
    formattedLatestTokens &&
    formattedLatestTokens.length > 0
  ) {
    let totalCurrentAmountUSD = 0
    currentTokensAmountUSD.map((value) => {
      const tokenAmountUSD = value[1]
      totalCurrentAmountUSD += tokenAmountUSD
      return null
    })

    const tokens = formattedLatestTokens.map((data) => {
      return data.token
    })

    const symbols = formattedLatestTokens.map((data) => {
      return data.symbol
    })

    const tokensVolume = formattedLatestTokens.map((data) => {
      return data.volume
    })

    formattedVolumeUSD.push({
      time: nowDate,
      current: totalCurrentAmountUSD,
      tokens,
      symbols,
      tokensVolume,
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

  // const [attemptingTxn, setAttemptingTxn] = useState(false)
  // const [txnHash, setTxnHash] = useState<string | undefined>()
  const addTransaction = useTransactionAdder()

  async function onSubscribe() {
    if (!chainId || !provider || !account || !currentPageFund) return
    const { calldata, value } = DotoliInfo.subscribeCallParameters(currentPageFund)
    const txn: { to: string; data: string; value: string } = {
      to: DOTOLI_INFO_ADDRESSES,
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
            // setTxnHash(response.hash)
            // setAttemptingTxn(false)
            addTransaction(response, {
              type: TransactionType.SUBSCRIBE,
              fundId: Number(currentPageFund),
              investor: account,
            })
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
      <ButtonYellow
        $borderRadius="12px"
        margin="6px"
        padding="12px"
        data-testid="navbar-connect-wallet"
        onClick={toggleWalletModal}
      >
        <ThemedText.BodyPrimary mb="4px">
          <Trans>Connect Wallet</Trans>
        </ThemedText.BodyPrimary>
      </ButtonYellow>
    ) : (userIsManager || userIsInvestor) && currentPageFund ? (
      <ButtonYellow
        $borderRadius="12px"
        margin="6px"
        padding="12px"
        onClick={() => onAccount(currentPageFund, account)}
      >
        <ThemedText.BodyPrimary mb="4px">
          <Trans>My Account</Trans>
        </ThemedText.BodyPrimary>
      </ButtonYellow>
    ) : (
      <ButtonYellow $borderRadius="12px" margin="6px" padding="12px" onClick={() => onSubscribe()}>
        <ThemedText.BodyPrimary mb="4px">
          <Trans>Subscribe</Trans>
        </ThemedText.BodyPrimary>
      </ButtonYellow>
    )

  const ButtonB = () =>
    account && userIsManager && currentPageFund ? (
      <ButtonYellow
        $borderRadius="12px"
        margin="6px"
        padding="12px"
        data-testid="navbar-connect-wallet"
        onClick={() => {
          navigate(`/fee/${currentPageFund}`)
        }}
      >
        <ThemedText.BodyPrimary mb="4px">
          <Trans>Fee</Trans>
        </ThemedText.BodyPrimary>
      </ButtonYellow>
    ) : null

  if (!isSupportedChain(chainId)) {
    return (
      <ErrorContainer>
        <ThemedText.DeprecatedBody color={theme.deprecated_text4} textAlign="center">
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
        {fundData && chainId ? (
          <AutoColumn gap="16px">
            <ResponsiveRow align="flex-end">
              <AutoColumn gap="lg">
                <RowFixed>
                  <ExternalLink href={getEtherscanLink(chainId, fundData.fundId, 'address')}>
                    <ThemedText.DeprecatedLabel ml="8px" mr="8px" fontSize="24px">
                      <Trans>Fund :</Trans> {fundData.fundId}
                    </ThemedText.DeprecatedLabel>
                  </ExternalLink>
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
              <PieChartWrapper>
                <AutoColumn gap="md">
                  <AutoRow gap="md">
                    <ThemedText.DeprecatedMain ml="8px">
                      <Trans>Current Asset Tokens</Trans>
                    </ThemedText.DeprecatedMain>
                  </AutoRow>
                  <PieChart
                    data={formattedHoverToken ? formattedHoverToken : formattedLatestTokens}
                    color={activeNetwork.primaryColor}
                  />
                </AutoColumn>
              </PieChartWrapper>
              <ChartWrapper>
                <ToggleRow>
                  <ToggleWrapper width="260px">
                    <ToggleElement
                      isActive={view === ChartView.CURRENT_ASSET_TOKENS}
                      fontSize="12px"
                      onClick={() =>
                        view === ChartView.CURRENT_ASSET_TOKENS ? {} : setView(ChartView.CURRENT_ASSET_TOKENS)
                      }
                    >
                      <Trans>Current Asset</Trans>
                    </ToggleElement>
                    <ToggleElement
                      isActive={view === ChartView.TOKENS}
                      fontSize="12px"
                      onClick={() => (view === ChartView.TOKENS ? {} : setView(ChartView.TOKENS))}
                    >
                      <Trans>Tokens</Trans>
                    </ToggleElement>
                    {userIsManager ? (
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
                {view === ChartView.CURRENT_ASSET_TOKENS ? (
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
                                ? formattedVolumeUSD[volumeIndexHover].current
                                : formattedVolumeUSD && formattedVolumeUSD.length > 0
                                ? formattedVolumeUSD[formattedVolumeUSD.length - 1].current
                                : 0
                            )}
                          </MonoSpace>
                        </ThemedText.DeprecatedLargeHeader>
                      </AutoColumn>
                    }
                    topRight={
                      <AutoColumn gap="4px" justify="end">
                        <ThemedText.DeprecatedMain fontSize="14px" height="14px" mb="30px">
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
                    topRight={
                      <AutoColumn gap="4px" justify="end">
                        <ThemedText.DeprecatedMain fontSize="14px">
                          <MonoSpace>
                            {unixToDate(nowDate)} ({formatTime(nowDate.toString(), 8)})
                          </MonoSpace>
                        </ThemedText.DeprecatedMain>
                        <ThemedText.DeprecatedLargeHeader fontSize="32px">
                          <MonoSpace>
                            {tokenIndexHover !== undefined && formattedLatestTokens && formattedLatestTokens.length > 0
                              ? formatAmount(formattedLatestTokens[tokenIndexHover].amount)
                              : formattedLatestTokens && formattedLatestTokens.length > 0
                              ? formatAmount(formattedLatestTokens[0].amount)
                              : null}
                            <br />
                          </MonoSpace>
                        </ThemedText.DeprecatedLargeHeader>
                      </AutoColumn>
                    }
                  />
                ) : userIsManager && view === ChartView.FEES ? (
                  <FeeBarChart
                    data={formattedFeeTokens}
                    color={activeNetwork.primaryColor}
                    setIndex={setFeeIndexHover}
                    topLeft={
                      <AutoColumn gap="4px">
                        <AutoRow>
                          <ThemedText.DeprecatedMediumHeader fontSize="16px">
                            {feeIndexHover !== undefined && formattedFeeTokens && formattedFeeTokens.length > 0
                              ? formattedFeeTokens[feeIndexHover].symbol === 'WETH'
                                ? 'ETH'
                                : formattedFeeTokens[feeIndexHover].symbol
                              : formattedFeeTokens && formattedFeeTokens.length > 0
                              ? formattedFeeTokens[0].symbol === 'WETH'
                                ? 'ETH'
                                : formattedFeeTokens[0].symbol
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
                              formatAmount(formattedFeeTokens[feeIndexHover].amount)
                            ) : formattedFeeTokens && formattedFeeTokens.length > 0 ? (
                              formatAmount(formattedFeeTokens[0].amount)
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
              </ChartWrapper>
            </ContentLayout>
            <ThemedText.DeprecatedMain mt="16px" fontSize="22px">
              <Trans>Manager</Trans>
            </ThemedText.DeprecatedMain>
            {managerData ? (
              <ManagerTable managerData={managerData} />
            ) : (
              <LoadingRows>
                <div />
              </LoadingRows>
            )}{' '}
            <ThemedText.DeprecatedMain mt="16px" fontSize="22px">
              <Trans>Investors</Trans>
            </ThemedText.DeprecatedMain>
            {investors ? (
              <InvestorTable investors={investors} />
            ) : (
              <LoadingRows>
                <div />
              </LoadingRows>
            )}{' '}
            <ThemedText.DeprecatedMain mt="16px" fontSize="22px">
              <Trans>Transactions</Trans>
            </ThemedText.DeprecatedMain>
            {transactions ? (
              <TransactionTable transactions={transactions} isFundPage={true} />
            ) : (
              <LoadingRows>
                <div />
              </LoadingRows>
            )}
          </AutoColumn>
        ) : (
          <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', marginTop: '280px' }}>
            <ClipLoader color="#ffffff" loading={true} size={50} aria-label="Loading Spinner" data-testid="loader" />
          </div>
        )}
      </PageWrapper>
    )
  }
}
