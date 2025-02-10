import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router"

import Home from "./pages/Home/Home";
import Chat from "./pages/Chat/Chat";

function App() {
  return (
    <div className="App">
     <Router>
        <Routes>
          <Route path="/" element={<Chat />} />
          <Route path="/chat2" element={<Home />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
