import './index.css'

import { green, purple } from '@mui/material/colors'
import { createTheme } from '@mui/material/styles'
import Web3Provider from 'components/Web3Provider'
import { FeatureFlagsProvider } from 'featureFlags'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import App from 'pages/App'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import store from 'state'
import ThemeProvider from 'theme'

import { LanguageProvider } from './i18n'
import reportWebVitals from './reportWebVitals'
import ApplicationUpdater from './state/application/updater'
import ListsUpdater from './state/lists/updater'
import TransactionUpdater from './state/transactions/updater'
import UserUpdater from './state/user/updater'

if (!!window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

function Updaters() {
  return (
    <>
      <ListsUpdater />
      <UserUpdater />
      <ApplicationUpdater />
      <TransactionUpdater />
    </>
  )
}

const theme = createTheme({
  palette: {
    primary: {
      main: green[500],
    },
    secondary: {
      main: purple[500],
    },
  },
})

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <FeatureFlagsProvider>
        <HashRouter>
          <LanguageProvider>
            <Web3Provider>
              <BlockNumberProvider>
                <Updaters />
                <ThemeProvider>
                  <App />
                </ThemeProvider>
              </BlockNumberProvider>
            </Web3Provider>
          </LanguageProvider>
        </HashRouter>
      </FeatureFlagsProvider>
    </Provider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
