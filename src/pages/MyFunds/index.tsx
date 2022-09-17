import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import XXXFund2Json from 'abis/XXXFund2.json'
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
import { isSupportedChain } from 'constants/chains'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import { TokensVariant, useTokensFlag } from 'featureFlags/flags/tokens'
import { useXXXFactoryContract } from 'hooks/useContract'
import { useSingleCallResult } from 'lib/hooks/multicall'
//import { useV3Positions } from 'hooks/useV3Positions'
import { AlertTriangle, BookOpen, ChevronDown, Inbox, PlusCircle } from 'react-feather'
import { Link } from 'react-router-dom'
import { useToggleWalletModal } from 'state/application/hooks'
//import { useUserHideClosedPositions } from 'state/user/hooks'
import { useUserHideClosedFunds } from 'state/user/hooks'
import styled, { css, useTheme } from 'styled-components/macro'
import { HideSmall, ThemedText } from 'theme'
//import { PositionDetails } from 'types/position'
import { FundDetails } from 'types/fund'

//import { useMultipleContractSingleData } from 'lib/hooks/multicall'
import { V2_FACTORY_ADDRESSES } from '../../constants/addresses'
import CTACards from './CTACards'
import { LoadingRows } from './styleds'

const { abi: XXXFund2ABI } = XXXFund2Json

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

export default function MyFunds() {
  const navBarFlag = useNavBarFlag()
  const navBarFlagEnabled = navBarFlag === NavBarVariant.Enabled
  const { account, chainId, provider } = useWeb3React()
  const toggleWalletModal = useToggleWalletModal()
  const XXXFactory = useXXXFactoryContract()
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

  const { loading: managingFundLoading, result: managingFund } = useSingleCallResult(XXXFactory, 'getFundByManager', [
    account ?? undefined,
  ])
  // console.log('loading', managingFundLoading)
  // console.log('result', managingFund)
  // const fund0: FundDetails[] = []
  // if (managingFund && managingFund?.length > 0) {
  //   fund0.push({
  //     token0: managingFund[0],
  //   })
  // }

  const { loading: investingFundsLoading, result: investingFunds } = useSingleCallResult(
    XXXFactory,
    'getInvestorFundList',
    [account ?? undefined]
  )

  if (account && provider) {
    // managingFundLoading = true
    // XXXFactory?.getFundByManager(account).then((response: any) => {
    //   //managingFund = response
    //   console.log(response)
    //   // const fundContract = getContract('address', XXXFund2Json, provider, account)
    //   // fundContract?.getInvestorTokens(account).then((response2: any) => {
    //   //   console.log(response2)
    //   //   managingFundLoading = false
    //   // })
    // })
    // investingFundsLoading = true
    // XXXFactory?.getInvestorFundList(account).then((response: any) => {
    //   //investingFunds = response
    //   console.log(response)
    //   // const balances = useMultipleContractSingleData(
    //   //   validatedTokenAddresses,
    //   //   XXXFund2Json,
    //   //   'getInvestorTokens',
    //   //   useMemo(() => [address], [address]),
    //   //   tokenBalancesGasRequirement
    //   // )
    //   investingFundsLoading = false
    // })
  }

  if (!isSupportedChain(chainId)) {
    return <WrongNetworkCard />
  }

  const [openInvestingFunds, closedInvestingFunds] = investingFunds?.reduce<[FundDetails[], FundDetails[]]>(
    (acc, p) => {
      acc[p.liquidity?.isZero() ? 1 : 0].push(p)
      return acc
    },
    [[], []]
  ) ?? [[], []]

  //const filteredInvestingFunds = [...openInvestingFunds, ...closedInvestingFunds]
  const filteredInvestingFunds: FundDetails[] = [
    {
      fund: '0xd850e79a4e02FC72CADB3bC303682907bC16662a',
      manager: '0xAC8fa658D92eB97D92c145774d103f4D9578da16',
      investor: '0xAC8fa658D92eB97D92c145774d103f4D9578da16',
      tokens: ['0xc778417E063141139Fce010982780140Aa0cD5Ab', '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'],
    },
  ]
  const showConnectAWallet = Boolean(!account)
  const showV2Features = Boolean(V2_FACTORY_ADDRESSES[chainId])

  const menuItems = [
    {
      content: (
        <MenuItem>
          <Trans>Invest in Fund</Trans>
          <PlusCircle size={16} />
        </MenuItem>
      ),
      link: '/add/ETH',
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

  return (
    <Trace page={PageName.POOL_PAGE} shouldLogImpression>
      <>
        <PageWrapper navBarFlag={navBarFlagEnabled}>
          <AutoColumn gap="lg" justify="center">
            <AutoColumn gap="lg" style={{ width: '100%' }}>
              <TitleRow padding={'0'}>
                <ThemedText.LargeHeader>
                  <Trans>My Funds</Trans>
                </ThemedText.LargeHeader>
                <ButtonRow>
                  {showV2Features && (
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
                  )}
                  <ResponsiveButtonPrimary data-cy="join-pool-button" id="join-pool-button" as={Link} to="/add/ETH">
                    + <Trans>Create Fund</Trans>
                  </ResponsiveButtonPrimary>
                </ButtonRow>
              </TitleRow>

              <MainContentWrapper>
                {managingFundLoading ? (
                  <FundsLoadingPlaceholder />
                ) : managingFund && managingFund.length > 0 ? (
                  <Trans>{managingFund}</Trans>
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
                ) : investingFunds && investingFunds.length > 0 ? (
                  //<Trans>{investingFunds}</Trans>
                  <FundList
                    funds={filteredInvestingFunds}
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
