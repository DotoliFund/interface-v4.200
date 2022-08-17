import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import { HashRouter } from 'react-router-dom'
import { green, purple } from '@mui/material/colors';
import { Provider } from 'react-redux'
import store from 'state'
import Web3Provider from './components/Web3Provider'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'

if (!!window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
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
});



const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <HashRouter>
        <Web3Provider>
          <BlockNumberProvider>
            <ThemeProvider theme={theme}>
              <App />
            </ThemeProvider>
          </BlockNumberProvider>
        </Web3Provider>
      </HashRouter>
    </Provider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
