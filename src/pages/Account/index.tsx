import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { PageName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { ButtonGray, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import FundList from 'components/FundList'
import { FlyoutAlignment, NewMenu } from 'components/Menu'
import { RowBetween, RowFixed } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { DOTOLI_FACTORY_ADDRESSES } from 'constants/addresses'
import { NULL_ADDRESS } from 'constants/addresses'
import { isSupportedChain } from 'constants/chains'
import { useDotoliFactoryContract } from 'hooks/useContract'
import { DotoliFactory } from 'interface/DotoliFactory'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useEffect, useState } from 'react'
import { AlertTriangle, BookOpen, ChevronDown, Inbox, PlusCircle } from 'react-feather'
import { useUserHideClosedFunds } from 'state/user/hooks'
import styled, { css, useTheme } from 'styled-components/macro'
import { HideSmall, ThemedText } from 'theme'
import { FundDetails } from 'types/fund'
import { calculateGasMargin } from 'utils/calculateGasMargin'

import CTACards from './CTACards'
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

const ErrorContainer = styled.div`
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

const NetworkIcon = styled(AlertTriangle)`
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
  background-color: ${({ theme }) => theme.deprecated_bg0};
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
      {/* {tokensFlag === TokensVariant.Enabled && <TokensBanner />} */}
      <PageWrapper>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              <ThemedText.DeprecatedBody fontSize={'20px'}>
                <Trans>My Funds</Trans>
              </ThemedText.DeprecatedBody>
            </TitleRow>

            <MainContentWrapper>
              <ErrorContainer>
                <ThemedText.DeprecatedBody color={theme.deprecated_text3} textAlign="center">
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
  const DotoliFactoryContract = useDotoliFactoryContract()
  const theme = useTheme()
  const [userHideClosedFunds, setUserHideClosedFunds] = useUserHideClosedFunds()

  const { loading: managingFundLoading, result: [managingFund] = [] } = useSingleCallResult(
    DotoliFactoryContract,
    'getFundByManager',
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
      if (managingFund && managingFund !== NULL_ADDRESS && provider && account) {
        setManagingFundInfo([
          {
            fund: managingFund,
            investor: account,
          },
        ])
      } else {
        setManagingFundInfo(undefined)
      }
    }
  }, [managingFundLoading, managingFund, provider, account])

  const { loading: investingFundsLoading, result: [investingFunds] = [] } = useSingleCallResult(
    DotoliFactoryContract,
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
          if (investingFund.toUpperCase() === managingFund.toUpperCase()) continue
          const investingFundsInfo: FundDetails = {
            fund: investingFund,
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

  const menuItems = [
    {
      content: (
        <MenuItem>
          <Trans>Invest</Trans>
          <PlusCircle size={16} />
        </MenuItem>
      ),
      link: '/overview',
      external: false,
    },
    {
      content: (
        <MenuItem>
          <Trans>Learn</Trans>
          <BookOpen size={16} />
        </MenuItem>
      ),
      link: 'https://docs.uniswap.org/',
      external: true,
    },
  ]

  if (!isSupportedChain(chainId)) {
    return <WrongNetworkCard />
  }

  async function onCreate() {
    if (!chainId || !provider || !account) return

    const { calldata, value } = DotoliFactory.createCallParameters()
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

  return (
    <Trace page={PageName.POOL_PAGE} shouldLogImpression>
      <>
        <PageWrapper>
          <AutoColumn gap="lg" justify="center">
            <AutoColumn gap="lg" style={{ width: '100%' }}>
              <TitleRow padding={'0'}>
                <ThemedText.DeprecatedBody fontSize={'20px'}>
                  <Trans>My Funds</Trans>
                </ThemedText.DeprecatedBody>
                <ButtonRow>
                  {
                    <Menu
                      menuItems={menuItems}
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
                  }
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
                  <FundList
                    isManagingFund={true}
                    funds={managingFundInfo}
                    setUserHideClosedFunds={setUserHideClosedFunds}
                    userHideClosedFunds={userHideClosedFunds}
                  />
                ) : (
                  <ErrorContainer>
                    <ThemedText.DeprecatedBody color={theme.deprecated_text3} textAlign="center">
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
                  <FundList
                    isManagingFund={false}
                    funds={investingFundsInfo}
                    setUserHideClosedFunds={setUserHideClosedFunds}
                    userHideClosedFunds={userHideClosedFunds}
                  />
                ) : (
                  <ErrorContainer>
                    <ThemedText.DeprecatedBody color={theme.deprecated_text3} textAlign="center">
                      <InboxIcon strokeWidth={1} />
                      <div>
                        <Trans>Your investing funds will appear here.</Trans>
                      </div>
                    </ThemedText.DeprecatedBody>
                  </ErrorContainer>
                )}
              </MainContentWrapper>
              <HideSmall>
                <CTACards />
              </HideSmall>
            </AutoColumn>
          </AutoColumn>
        </PageWrapper>
        <SwitchLocaleLink />
      </>
    </Trace>
  )
}
