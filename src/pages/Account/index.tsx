import type { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { PageName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import FundList from 'components/FundList'
import { RowBetween, RowFixed } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { DOTOLI_INFO_ADDRESSES } from 'constants/addresses'
import { isSupportedChain } from 'constants/chains'
import { useDotoliInfoContract } from 'hooks/useContract'
import { DotoliInfo } from 'interface/DotoliInfo'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useEffect, useState } from 'react'
import { AlertTriangle, Inbox } from 'react-feather'
import { useTransactionAdder } from 'state/transactions/hooks'
import styled, { css, useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { FundDetails } from 'types/fund'
import { calculateGasMargin } from 'utils/calculateGasMargin'

import { TransactionType } from '../../state/transactions/types'
import { LoadingRows } from './styleds'

const PageWrapper = styled(AutoColumn)`
  max-width: 870px;
  width: 100%;
  padding: 68px 12px 0px;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    max-width: 800px;
    padding: 0px 8px;
  `};
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    max-width: 500px;
  `};
`
const TitleRow = styled(RowBetween)`
  color: ${({ theme }) => theme.deprecated_text4};
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

export const ErrorContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: auto;
  max-width: 300px;
  min-height: 25vh;
`

const IconStyle = css`
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
`

export const NetworkIcon = styled(AlertTriangle)`
  ${IconStyle}
`

const InboxIcon = styled(Inbox)`
  ${IconStyle}
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
  background-color: ${({ theme }) => theme.deprecated_bg1};
  padding: 8px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
`

function FundsLoadingPlaceholder() {
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

function WrongNetworkCard() {
  const theme = useTheme()
  return (
    <>
      <PageWrapper>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem' }} padding="0">
              <ThemedText.DeprecatedBody fontSize="20px">
                <Trans>My Account</Trans>
              </ThemedText.DeprecatedBody>
            </TitleRow>

            <MainContentWrapper>
              <ErrorContainer>
                <ThemedText.DeprecatedBody color={theme.deprecated_text4} textAlign="center">
                  <NetworkIcon strokeWidth={1.2} />
                  <div data-testid="pools-unsupported-err">
                    <Trans>Your connected network is unsupported.</Trans>
                  </div>
                </ThemedText.DeprecatedBody>
              </ErrorContainer>
            </MainContentWrapper>
          </AutoColumn>
        </AutoColumn>
      </PageWrapper>
      <SwitchLocaleLink />
    </>
  )
}

export default function Account() {
  const { account, chainId, provider } = useWeb3React()
  const DotoliInfoContract = useDotoliInfoContract()
  const theme = useTheme()

  const { loading: managingFundLoading, result: [managingFund] = [] } = useSingleCallResult(
    DotoliInfoContract,
    'managingFund',
    [account ?? undefined]
  )

  const [managingFundInfo, setManagingFundInfo] = useState<FundDetails[]>()
  const [managingFundInfoLoading, setManagingFundInfoLoading] = useState(false)
  useEffect(() => {
    if (managingFundLoading) {
      setManagingFundInfoLoading(true)
    }
    if (!managingFundLoading) {
      getInfo()
      setManagingFundInfoLoading(false)
    }
    async function getInfo() {
      if (managingFund && JSBI.BigInt(managingFund).toString() !== '0' && provider && account) {
        setManagingFundInfo([
          {
            fundId: JSBI.BigInt(managingFund).toString(),
            investor: account,
          },
        ])
      } else {
        setManagingFundInfo(undefined)
      }
    }
  }, [managingFundLoading, managingFund, provider, account])

  const { loading: investingFundsLoading, result: [investingFunds] = [] } = useSingleCallResult(
    DotoliInfoContract,
    'subscribedFunds',
    [account ?? undefined]
  )

  const [investingFundsInfo, setInvestingFundsInfo] = useState<FundDetails[]>()
  const [investingFundsInfoLoading, setInvestingFundsInfoLoading] = useState(false)
  useEffect(() => {
    if (investingFundsLoading) {
      setInvestingFundsInfoLoading(true)
    }
    if (!investingFundsLoading) {
      getInfo()
      setInvestingFundsInfoLoading(false)
    }
    async function getInfo() {
      if (investingFunds && investingFunds.length > 0 && provider && account) {
        const investingFundList = investingFunds
        const investingFundsInfoList: FundDetails[] = []

        for (let i = 0; i < investingFundList.length; i++) {
          const investingFund: string = investingFundList[i]
          if (JSBI.BigInt(investingFund).toString() === JSBI.BigInt(managingFund).toString()) continue
          const investingFundsInfo: FundDetails = {
            fundId: JSBI.BigInt(investingFund).toString(),
            investor: account,
          }
          investingFundsInfoList.push(investingFundsInfo)
        }
        if (investingFundsInfoList.length === 0) {
          setInvestingFundsInfo(undefined)
        } else {
          setInvestingFundsInfo(investingFundsInfoList)
        }
      } else {
        setInvestingFundsInfo(undefined)
      }
    }
  }, [investingFundsLoading, managingFund, investingFunds, provider, account])

  // const [attemptingTxn, setAttemptingTxn] = useState(false)
  // const [txnHash, setTxnHash] = useState<string | undefined>()
  const addTransaction = useTransactionAdder()

  if (!isSupportedChain(chainId)) {
    return <WrongNetworkCard />
  }

  async function onCreate() {
    if (!chainId || !provider || !account) return

    const { calldata, value } = DotoliInfo.createCallParameters()
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
          .then((response: TransactionResponse) => {
            // setTxnHash(response.hash)
            // setAttemptingTxn(false)
            addTransaction(response, {
              type: TransactionType.CREATE_FUND,
              manager: account,
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

  return (
    <Trace page={PageName.POOL_PAGE} shouldLogImpression>
      <>
        <PageWrapper>
          <AutoColumn gap="lg" justify="center">
            <AutoColumn gap="lg" style={{ width: '100%' }}>
              <TitleRow padding="0">
                <ThemedText.DeprecatedBody fontSize="20px">
                  <Trans>My Account</Trans>
                </ThemedText.DeprecatedBody>
                <ButtonRow>
                  {managingFundInfo && managingFundInfo.length > 0 ? (
                    <></>
                  ) : (
                    <ResponsiveButtonPrimary
                      data-cy="join-pool-button"
                      id="join-pool-button"
                      onClick={() => {
                        onCreate()
                      }}
                    >
                      + <Trans>Create Fund</Trans>
                    </ResponsiveButtonPrimary>
                  )}
                </ButtonRow>
              </TitleRow>

              <MainContentWrapper>
                {managingFundLoading || managingFundInfoLoading ? (
                  <FundsLoadingPlaceholder />
                ) : managingFundInfo && managingFundInfo.length > 0 ? (
                  <FundList isManagingFund={true} funds={managingFundInfo} />
                ) : (
                  <ErrorContainer>
                    <ThemedText.DeprecatedBody color={theme.deprecated_text4} textAlign="center">
                      <InboxIcon strokeWidth={1} />
                      <div>
                        <Trans>Your managing fund will appear here.</Trans>
                      </div>
                    </ThemedText.DeprecatedBody>
                  </ErrorContainer>
                )}
              </MainContentWrapper>
              <MainContentWrapper>
                {investingFundsLoading || investingFundsInfoLoading ? (
                  <FundsLoadingPlaceholder />
                ) : investingFundsInfo && investingFundsInfo.length > 0 ? (
                  <FundList isManagingFund={false} funds={investingFundsInfo} />
                ) : (
                  <ErrorContainer>
                    <ThemedText.DeprecatedBody color={theme.deprecated_text4} textAlign="center">
                      <InboxIcon strokeWidth={1} />
                      <div>
                        <Trans>Your investing funds will appear here.</Trans>
                      </div>
                    </ThemedText.DeprecatedBody>
                  </ErrorContainer>
                )}
              </MainContentWrapper>
              {/* <HideSmall>
                <CTACards />
              </HideSmall> */}
            </AutoColumn>
          </AutoColumn>
        </PageWrapper>
        <SwitchLocaleLink />
      </>
    </Trace>
  )
}
