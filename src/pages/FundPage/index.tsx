import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import FeeBarChart from 'components/BarChart/fee'
import TokenBarChart from 'components/BarChart/token'
import VolumeBarChart from 'components/BarChart/volume'
import { ButtonPrimary } from 'components/Button'
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
import { DOTOLI_FUND_ADDRESSES } from 'constants/addresses'
import { EthereumNetworkInfo } from 'constants/networks'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useFundData } from 'data/FundPage/fundData'
import { useInvestors } from 'data/FundPage/investors'
import { useManagerData } from 'data/FundPage/managerData'
import { useFundTransactions } from 'data/FundPage/transactions'
import { useVolumeChartData } from 'data/FundPage/volumeChartData'
import { useColor } from 'hooks/useColor'
import { useDotoliFundContract } from 'hooks/useContract'
import { useETHPriceInUSD, useTokensPriceInUSD } from 'hooks/usePools'
import { DotoliFund } from 'interface/DotoliFund'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ClipLoader from 'react-spinners/ClipLoader'
import { useActiveNetworkVersion } from 'state/application/hooks'
import { useToggleWalletModal } from 'state/application/hooks'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { getEtherscanLink, shortenAddress } from 'utils'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { formatTime, unixToDate } from 'utils/date'
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
  const fundId = params.fundId
  const DotoliFundContract = useDotoliFundContract()
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

  const { loading: isManagerLoading, result: [myFundId] = [] } = useSingleCallResult(
    DotoliFundContract,
    'managingFund',
    [account ?? undefined]
  )
  const [isManager, setIsManager] = useState<boolean>(false)
  useEffect(() => {
    if (!isManagerLoading) {
      setState()
    }
    async function setState() {
      if (myFundId && fundId && JSBI.BigInt(myFundId).toString() === JSBI.BigInt(fundId).toString()) {
        setIsManager(true)
      } else {
        setIsManager(false)
      }
    }
  }, [isManagerLoading, myFundId, fundId])

  const { loading: isInvestorLoading, result: [isSubscribed] = [] } = useSingleCallResult(
    DotoliFundContract,
    'isSubscribed',
    [account, fundId]
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
  }, [isInvestorLoading, isSubscribed])

  const fundData = useFundData(fundId).data
  const volumeChartData = useVolumeChartData(fundId).data
  const transactions = useFundTransactions(fundId).data
  const managerData = useManagerData(fundId).data
  const investors = useInvestors(fundId).data

  const [view, setView] = useState(ChartView.VOL_USD)

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
        return CurrencyAmount.fromRawAmount(token, fundData.currentTokensAmount[index] * decimal)
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

  if (formattedVolumeUSD && formattedVolumeUSD.length > 1) {
    let totalCurrentAmountUSD = 0
    currentTokensAmountUSD.map((value, index) => {
      const tokenAmountUSD = value[1]
      totalCurrentAmountUSD += tokenAmountUSD
      return null
    })
    formattedVolumeUSD.push({
      time: nowDate,
      current: totalCurrentAmountUSD,
      tokens: formattedVolumeUSD[formattedVolumeUSD.length - 1].tokens,
      symbols: formattedVolumeUSD[formattedVolumeUSD.length - 1].symbols,
      tokensVolume: formattedVolumeUSD[formattedVolumeUSD.length - 1].tokensVolume,
      index: formattedVolumeUSD.length,
    })
  }

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
    if (!chainId || !provider || !account || !fundId) return
    const { calldata, value } = DotoliFund.subscribeCallParameters(fundId)
    const txn: { to: string; data: string; value: string } = {
      to: DOTOLI_FUND_ADDRESSES,
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
    ) : (isManager || isInvestor) && fundId ? (
      <ButtonPrimary $borderRadius="12px" margin={'6px'} padding={'12px'} onClick={() => onAccount(fundId, account)}>
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
    account && isManager && fundId ? (
      <ButtonPrimary
        $borderRadius="12px"
        margin={'6px'}
        padding={'12px'}
        data-testid="navbar-connect-wallet"
        onClick={() => {
          navigate(`/fee/${fundId}`)
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
      {fundData && chainId ? (
        <AutoColumn gap="16px">
          <ResponsiveRow align="flex-end">
            <AutoColumn gap="lg">
              <RowFixed>
                <ExternalLink href={getEtherscanLink(chainId, fundData.fundId, 'address', activeNetwork)}>
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
            <DarkGreyCard>
              <AutoColumn gap="md">
                <AutoRow gap="md">
                  <ThemedText.DeprecatedMain ml="8px">
                    <Trans>Current Tokens</Trans>
                  </ThemedText.DeprecatedMain>
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
            <Trans>Manager</Trans>
          </ThemedText.DeprecatedMain>
          <DarkGreyCard>
            {managerData ? (
              <ManagerTable managerData={managerData} />
            ) : (
              <LoadingRows>
                <div />
              </LoadingRows>
            )}{' '}
          </DarkGreyCard>
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
              <TransactionTable transactions={transactions} isFundPage={true} />
            ) : (
              <LoadingRows>
                <div />
              </LoadingRows>
            )}
          </DarkGreyCard>
        </AutoColumn>
      ) : (
        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', marginTop: '280px' }}>
          <ClipLoader color={'#ffffff'} loading={true} size={50} aria-label="Loading Spinner" data-testid="loader" />
        </div>
      )}
    </PageWrapper>
  )
}
