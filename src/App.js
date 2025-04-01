import './App.css';
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router"
import { HomeProvider } from './context/HomeContext';
import Login from "./pages/Login/Login";
import Profile from "./pages/Profile/Profile";
import ProtectedRoute from "./pages/ProtectedRoute/ProtectedRoute";

import Home from "./pages/Home/Home";

const App = () => {
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // document.body.classList.remove('dark-light');
        document.body.classList.add('dark-mode');
    }
  }, []);
return (
    <div className="App">
      <Router>
          <Routes>
            <Route path="/login" element={<Login/> } />

            <Route path="/" element={
              <HomeProvider>
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              </HomeProvider>} />
            <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute> } />
          </Routes>
        </Router>
    </div>
  );
}

export default App;
