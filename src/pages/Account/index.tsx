import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { PageName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { ButtonGray, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import FundList from 'components/FundList'
//import PositionList from 'components/PositionList'
import { FlyoutAlignment, NewMenu } from 'components/Menu'
import { RowBetween, RowFixed } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TokensBanner from 'components/Tokens/TokensBanner'
import { NULL_ADDRESS, XXXFACTORY_ADDRESSES } from 'constants/addresses'
import { isSupportedChain } from 'constants/chains'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import { TokensVariant, useTokensFlag } from 'featureFlags/flags/tokens'
import { useXXXFactoryContract } from 'hooks/useContract'
import { XXXFactory } from 'interface/XXXFactory'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useEffect, useState } from 'react'
//import { useV3Positions } from 'hooks/useV3Positions'
import { AlertTriangle, BookOpen, ChevronDown, Inbox, PlusCircle } from 'react-feather'
import { useToggleWalletModal } from 'state/application/hooks'
//import { useUserHideClosedPositions } from 'state/user/hooks'
import { useUserHideClosedFunds } from 'state/user/hooks'
import styled, { css, useTheme } from 'styled-components/macro'
import { HideSmall, ThemedText } from 'theme'
//import { PositionDetails } from 'types/position'
import { FundDetails } from 'types/fund'
import { calculateGasMargin } from 'utils/calculateGasMargin'

//import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import CTACards from './CTACards'
import { LoadingRows } from './styleds'

const PageWrapper = styled(AutoColumn)<{ navBarFlag: boolean }>`
  padding: ${({ navBarFlag }) => (navBarFlag ? '68px 8px 0px' : '0px')};
  max-width: 870px;
  width: 100%;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    max-width: 800px;
  `};

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    max-width: 500px;
  `};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: ${({ navBarFlag }) => (navBarFlag ? '48px' : '0px')};
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: ${({ navBarFlag }) => (navBarFlag ? '20px' : '0px')};
  }
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
  const navBarFlag = useNavBarFlag()
  const navBarFlagEnabled = navBarFlag === NavBarVariant.Enabled
  const theme = useTheme()
  const tokensFlag = useTokensFlag()
  return (
    <>
      {tokensFlag === TokensVariant.Enabled && <TokensBanner />}
      <PageWrapper navBarFlag={navBarFlagEnabled}>
        <AutoColumn gap="lg" justify="center">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow padding={'0'}>
              <ThemedText.LargeHeader>
                <Trans>My Funds</Trans>
              </ThemedText.LargeHeader>
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
  const navBarFlag = useNavBarFlag()
  const navBarFlagEnabled = navBarFlag === NavBarVariant.Enabled
  const { account, chainId, provider } = useWeb3React()
  const toggleWalletModal = useToggleWalletModal()
  const XXXFactoryContract = useXXXFactoryContract()
  const theme = useTheme()
  //const [userHideClosedPositions, setUserHideClosedPositions] = useUserHideClosedPositions()
  const [userHideClosedFunds, setUserHideClosedFunds] = useUserHideClosedFunds()

  //const { positions, loading: positionsLoading } = useV3Positions(account)
  //const { funds, loading: fundsLoading } = useFunds(account)
  //const { funds: managingFund, loading: managingFundLoading } = useManagingFund(account)
  //const { funds: investingFunds, loading: investingFundsLoading } = useInvestingFunds(account)
  // const managingFund: FundDetails[] = []
  // const managingFundLoading = false
  // const investingFunds: FundDetails[] = []
  // const investingFundsLoading = false

  // console.log('loading', managingFundLoading)
  // console.log('result', managingFund)
  // const fund0: FundDetails[] = []
  // if (managingFund && managingFund?.length > 0) {
  //   fund0.push({
  //     token0: managingFund[0],
  //   })
  // }

  const { loading: managingFundLoading, result: managingFund } = useSingleCallResult(
    XXXFactoryContract,
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
      if (!managingFundLoading && managingFund && managingFund[0] !== NULL_ADDRESS && provider && account) {
        setManagingFundInfo([
          {
            fund: managingFund[0],
            investor: account,
          },
        ])
        // const fundContract = getContract(managingFund[0], XXXFund2Json, provider, account)
        // await fundContract.getManagerTokens().then((response: any) => {
        //   const _fundTokens = response.map((value: any) => [value[0], value[1].toBigInt()])
        //   setManagingFundInfo(_fundTokens)
        //   console.log('111111 managingFundTokens :', _fundTokens)
        // })
      }
    }
  }, [managingFundLoading, managingFund, provider, account])

  const { loading: investingFundsLoading, result: investingFunds } = useSingleCallResult(
    XXXFactoryContract,
    'subscribedFunds',
    []
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
      if (
        !investingFundsLoading &&
        investingFunds &&
        investingFunds[0].length > 0 &&
        investingFunds[0] !== NULL_ADDRESS &&
        provider &&
        account
      ) {
        const investingFundList = investingFunds[0]
        const investingFundsInfoList: FundDetails[] = []

        for (let i = 0; i < investingFundList.length; i++) {
          const investingFundsInfo: FundDetails = {
            fund: investingFundList[i],
            investor: account,
          }
          investingFundsInfoList.push(investingFundsInfo)
        }
        setInvestingFundsInfo(investingFundsInfoList)
      }
    }
  }, [investingFundsLoading, investingFunds, provider, account])

  console.log('managingFund', managingFund)
  console.log('investingFunds', investingFunds)

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

    const { calldata, value } = XXXFactory.createCallParameters()
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

  return (
    <Trace page={PageName.POOL_PAGE} shouldLogImpression>
      <>
        <PageWrapper navBarFlag={navBarFlagEnabled}>
          <AutoColumn gap="lg" justify="center">
            <AutoColumn gap="lg" style={{ width: '100%' }}>
              <TitleRow padding={'0'}>
                <ThemedText.LargeHeader>
                  <Trans>My Account</Trans>
                </ThemedText.LargeHeader>
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
                {investingFundsLoading ? (
                  <FundsLoadingPlaceholder />
                ) : investingFundsInfo && investingFundsInfo.length > 0 ? (
                  //<Trans>{investingFunds}</Trans>
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
