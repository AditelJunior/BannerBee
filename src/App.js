import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router"
import { HomeProvider } from './context/HomeContext';

import Home from "./pages/Home/Home";

const App = () => {
return (
    <div className="App">
     <Router>
        <Routes>
          <Route path="/" element={<HomeProvider><Home /></HomeProvider>} />
          {/* <Route path="/" element={<Chat />} /> */}
        </Routes>
      </Router>
    </div>
  );
}

export default App;
