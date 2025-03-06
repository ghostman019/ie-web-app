import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Games from './pages/Games';
import Staking from './pages/Staking';
import Whitepaper from './pages/Whitepaper';
import Roadmap from './pages/Roadmap';
import './styles/globals.css'; // Ensure this import is present

function App() {
  return (
    <Router>
      <div id="root">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<Games />} />
            <Route path="/staking" element={<Staking />} />
            <Route path="/whitepaper" element={<Whitepaper />} />
            <Route path="/roadmap" element={<Roadmap />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;