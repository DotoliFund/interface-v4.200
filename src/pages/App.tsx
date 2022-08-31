import './App.css'

import ResponsiveAppBar from 'pages/Appbar'
import CreateFund from 'pages/CreateFund'
import Fund from 'pages/Fund'
import FundDeposit from 'pages/Fund/FundDetail/deposit'
import FundSwap from 'pages/Fund/FundDetail/swap/swap'
import FundWithdraw from 'pages/Fund/FundDetail/withdraw'
import Main from 'pages/Main'
import OverView from 'pages/OverView'
import React from 'react'
import { Route, Routes } from 'react-router-dom'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <ResponsiveAppBar />
      </header>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/overview" element={<OverView />} />
        <Route path="/createFund" element={<CreateFund />} />
        <Route path="/fund" element={<Fund />} />
        <Route path="/deposit" element={<FundDeposit />} />
        <Route path="/withdraw" element={<FundWithdraw />} />
        <Route path="/swap" element={<FundSwap />} />
      </Routes>
    </div>
  )
}

export default App
