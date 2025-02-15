import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router"
import { HomeProvider } from './context/HomeContext';

import Home from "./pages/Home/Home";
import Chat from "./pages/Chat/Chat";

const App = () => {
return (
    <div className="App">
     <Router>
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/chat" element={<HomeProvider><Home /></HomeProvider>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
