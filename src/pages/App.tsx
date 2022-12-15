import { initializeAnalytics, sendAnalyticsEvent, user } from 'components/AmplitudeAnalytics'
import { CUSTOM_USER_PROPERTIES, EventName, PageName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import Loader from 'components/Loader'
import NavBar from 'components/NavBar'
import TopLevelModals from 'components/TopLevelModals'
import { useFeatureFlagsIsLoaded } from 'featureFlags'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import Account from 'pages/Account'
import Deposit from 'pages/Deposit'
import FundAccount from 'pages/FundAccount'
import FundPage from 'pages/FundPage'
import Home from 'pages/Home'
import WOverview from 'pages/Overview'
import Staking from 'pages/Staking'
import Swap from 'pages/Swap'
import Withdraw from 'pages/Withdraw'
import { Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme/zIndex'
import { getBrowser } from 'utils/browser'
import { getCLS, getFCP, getFID, getLCP, Metric } from 'web-vitals'

import { useAnalyticsReporter } from '../components/analytics'
import ErrorBoundary from '../components/ErrorBoundary'
import Polling from '../components/Header/Polling'
import Popups from '../components/Popups'
import { useIsExpertMode } from '../state/user/hooks'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import { RedirectDuplicateTokenIds } from './AddLiquidity/redirects'
import { PositionPage } from './Pool/PositionPage'
import RemoveLiquidityV3 from './RemoveLiquidity/V3'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 72px 0px 0px 0px;
  align-items: center;
  flex: 1;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    padding: 52px 0px 16px 0px;
  `};
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
  position: fixed;
  top: 0;
  z-index: ${Z_INDEX.sticky};
`

const Marginer = styled.div`
  margin-top: 5rem;
`

function getCurrentPageFromLocation(locationPathname: string): PageName | undefined {
  switch (locationPathname) {
    case '/swap':
      return PageName.SWAP_PAGE
    case '/vote':
      return PageName.VOTE_PAGE
    case '/pool':
      return PageName.POOL_PAGE
    case '/tokens':
      return PageName.TOKENS_PAGE
    default:
      return undefined
  }
}

export default function App() {
  const isLoaded = useFeatureFlagsIsLoaded()

  const { pathname } = useLocation()
  const currentPage = getCurrentPageFromLocation(pathname)
  const isDarkMode = useIsDarkMode()
  const isExpertMode = useIsExpertMode()

  useAnalyticsReporter()
  initializeAnalytics()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    sendAnalyticsEvent(EventName.APP_LOADED)
    user.set(CUSTOM_USER_PROPERTIES.BROWSER, getBrowser())
    user.set(CUSTOM_USER_PROPERTIES.SCREEN_RESOLUTION_HEIGHT, window.screen.height)
    user.set(CUSTOM_USER_PROPERTIES.SCREEN_RESOLUTION_WIDTH, window.screen.width)
    getCLS(({ delta }: Metric) => sendAnalyticsEvent(EventName.WEB_VITALS, { cumulative_layout_shift: delta }))
    getFCP(({ delta }: Metric) => sendAnalyticsEvent(EventName.WEB_VITALS, { first_contentful_paint_ms: delta }))
    getFID(({ delta }: Metric) => sendAnalyticsEvent(EventName.WEB_VITALS, { first_input_delay_ms: delta }))
    getLCP(({ delta }: Metric) => sendAnalyticsEvent(EventName.WEB_VITALS, { largest_contentful_paint_ms: delta }))
  }, [])

  useEffect(() => {
    user.set(CUSTOM_USER_PROPERTIES.DARK_MODE, isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    user.set(CUSTOM_USER_PROPERTIES.EXPERT_MODE, isExpertMode)
  }, [isExpertMode])

  return (
    <ErrorBoundary>
      <DarkModeQueryParamReader />
      <ApeModeQueryParamReader />
      <AppWrapper>
        <Trace page={currentPage}>
          <HeaderWrapper>
            <NavBar />
          </HeaderWrapper>
          <BodyWrapper>
            <Popups />
            <Polling />
            <TopLevelModals />
            <Suspense fallback={<Loader />}>
              {isLoaded ? (
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="home" element={<Home />} />
                  <Route path="overview" element={<WOverview />} />
                  <Route path="account" element={<Account />} />
                  <Route path="fund/:fundAddress" element={<FundPage />} />
                  <Route path="fund/:fundAddress/:investorAddress" element={<FundAccount />} />
                  <Route path="deposit/:fundAddress/:investorAddress" element={<Deposit />} />
                  <Route path="withdraw/:fundAddress/:investorAddress" element={<Withdraw />} />
                  <Route path="swap/:fundAddress/:investorAddress" element={<Swap />} />
                  <Route path="pool/:fundAddress/:investorAddress/:tokenId" element={<PositionPage />} />
                  <Route path="add" element={<RedirectDuplicateTokenIds />}>
                    {/* this is workaround since react-router-dom v6 doesn't support optional parameters any more */}
                    <Route path=":fundAddress/:investorAddress/:currencyIdA" />
                    <Route path=":fundAddress/:investorAddress/:currencyIdA/:currencyIdB" />
                    <Route path=":fundAddress/:investorAddress/:currencyIdA/:currencyIdB/:feeAmount" />
                  </Route>
                  <Route path="increase" element={<AddLiquidity />}>
                    <Route path=":fundAddress/:investorAddress/:currencyIdA" />
                    <Route path=":fundAddress/:investorAddress/:currencyIdA/:currencyIdB" />
                    <Route path=":fundAddress/:investorAddress/:currencyIdA/:currencyIdB/:feeAmount" />
                    <Route path=":fundAddress/:investorAddress/:currencyIdA/:currencyIdB/:feeAmount/:tokenId" />
                  </Route>
                  <Route path="remove/:fundAddress/:investorAddress/:tokenId" element={<RemoveLiquidityV3 />} />
                  <Route path="staking" element={<Staking />} />

                  <Route path="*" element={<Home />} />
                </Routes>
              ) : (
                <Loader />
              )}
            </Suspense>
            <Marginer />
          </BodyWrapper>
        </Trace>
      </AppWrapper>
    </ErrorBoundary>
  )
}
