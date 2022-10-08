import { initializeAnalytics, sendAnalyticsEvent, user } from 'components/AmplitudeAnalytics'
import { CUSTOM_USER_PROPERTIES, EventName, PageName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import Loader from 'components/Loader'
import TopLevelModals from 'components/TopLevelModals'
import { useFeatureFlagsIsLoaded } from 'featureFlags'
import { NavBarVariant, useNavBarFlag } from 'featureFlags/flags/navBar'
import { useNftFlag } from 'featureFlags/flags/nft'
import { useTokensFlag } from 'featureFlags/flags/tokens'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import Account from 'pages/Account'
import Deposit from 'pages/Deposit'
import Fund from 'pages/Fund'
import Main from 'pages/Main'
import Overview from 'pages/Overview'
import Swap from 'pages/Swap'
import Withdraw from 'pages/Withdraw'
import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useIsDarkMode } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { SpinnerSVG } from 'theme/components'
import { getBrowser } from 'utils/browser'
import { getCLS, getFCP, getFID, getLCP, Metric } from 'web-vitals'

import { useAnalyticsReporter } from '../components/analytics'
import ErrorBoundary from '../components/ErrorBoundary'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
import Navbar from '../components/NavBar'
import Popups from '../components/Popups'
import { useIsExpertMode } from '../state/user/hooks'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
// import Pool from './Pool'
// import { PositionPage } from './Pool/PositionPage'
// import PoolV2 from './Pool/v2'
// import PoolFinder from './PoolFinder'

const Vote = lazy(() => import('pages/Swap'))

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
`

const BodyWrapper = styled.div<{ navBarFlag: NavBarVariant }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: ${({ navBarFlag }) => (navBarFlag === NavBarVariant.Enabled ? `72px 0px 0px 0px` : `120px 0px 0px 0px`)};
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
  z-index: 2;
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

// this is the same svg defined in assets/images/blue-loader.svg
// it is defined here because the remote asset may not have had time to load when this file is executing
const LazyLoadSpinner = () => (
  <SpinnerSVG width="94" height="94" viewBox="0 0 94 94" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M92 47C92 22.1472 71.8528 2 47 2C22.1472 2 2 22.1472 2 47C2 71.8528 22.1472 92 47 92"
      stroke="#2172E5"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </SpinnerSVG>
)

export default function App() {
  const isLoaded = useFeatureFlagsIsLoaded()
  const tokensFlag = useTokensFlag()
  const navBarFlag = useNavBarFlag()
  const nftFlag = useNftFlag()

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
    getCLS(({ delta, id }: Metric) => sendAnalyticsEvent(EventName.WEB_VITALS, { cumulative_layout_shift: delta }))
    getFCP(({ delta, id }: Metric) => sendAnalyticsEvent(EventName.WEB_VITALS, { first_contentful_paint_ms: delta }))
    getFID(({ delta, id }: Metric) => sendAnalyticsEvent(EventName.WEB_VITALS, { first_input_delay_ms: delta }))
    getLCP(({ delta, id }: Metric) => sendAnalyticsEvent(EventName.WEB_VITALS, { largest_contentful_paint_ms: delta }))
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
          <HeaderWrapper>{navBarFlag === NavBarVariant.Enabled ? <Navbar /> : <Header />}</HeaderWrapper>
          <BodyWrapper navBarFlag={navBarFlag}>
            <Popups />
            <Polling />
            <TopLevelModals />
            <Suspense fallback={<Loader />}>
              {isLoaded ? (
                <Routes>
                  <Route path="/" element={<Main />} />
                  <Route path="overview" element={<Overview />} />
                  <Route path="account" element={<Account />} />
                  <Route path="fund" element={<Fund />} />
                  <Route path="fund/:fundAddress" element={<Fund />} />
                  <Route path="swap" element={<Swap />} />
                  <Route path="deposit" element={<Deposit />} />
                  <Route path="deposit/:fund/:tokenId" element={<Deposit />} />
                  <Route path="withdraw" element={<Withdraw />} />
                  <Route path="withdraw/:fund/:tokenId" element={<Withdraw />} />
                  <Route path="swap/:fund/:currencyIdA/:currencyIdB" element={<Swap />} />
                  <Route
                    path="vote/*"
                    element={
                      <Suspense fallback={<LazyLoadSpinner />}>
                        <Vote />
                      </Suspense>
                    }
                  />
                  <Route path="create-proposal" element={<Navigate to="/vote/create-proposal" replace />} />
                  <Route path="earn" element={<Swap />} />

                  <Route path="*" element={<Overview />} />
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
