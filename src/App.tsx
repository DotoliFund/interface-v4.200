import React from 'react';
import logo from './logo.svg';
import './App.css';

import { Route, Routes } from 'react-router-dom';
import ResponsiveAppBar from 'pages/Appbar'
import Main from 'pages/Main';
import OverView from 'pages/OverView';
import CreateFund from 'pages/CreateFund';
import Fund from 'pages/Fund';
import FundDeposit from 'pages/Fund/FundDetail/deposit';
import FundWithdraw from 'pages/Fund/FundDetail/withdraw';
import FundSwap from 'pages/Fund/FundDetail/swap';


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <ResponsiveAppBar />
      </header>
      <Routes>
        <Route path='/' element={<Main />}/>
        <Route path='/overview' element={<OverView />}/>
        <Route path='/createFund' element={<CreateFund />}/>
        <Route path='/fund' element={<Fund />}/>
        <Route path='/deposit' element={<FundDeposit />}/>
        <Route path='/withdraw' element={<FundWithdraw />}/>
        <Route path='/swap' element={<FundSwap />}/>
      </Routes>
    </div>
  );
}

export default App;
