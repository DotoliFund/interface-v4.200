import React from 'react';
import logo from './logo.svg';
import './App.css';

import { Route, Routes } from 'react-router-dom';
import ResponsiveAppBar from './pages/Appbar'
import Main from './pages/Main';
import OverView from './pages/OverView';
import CreateFund from './pages/CreateFund';
import Fund from './pages/Fund';




function App() {
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <ResponsiveAppBar />
      <Routes>
        <Route path='/' element={<Main />}/>
        <Route path='/overview' element={<OverView />}/>
        <Route path='/createFund' element={<CreateFund />}/>
        <Route path='/fund' element={<Fund />}/>
      </Routes>
    </div>
  );
}

export default App;
