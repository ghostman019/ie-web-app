import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Games from "./pages/Games";
import Staking from "./pages/Staking";
import Whitepaper from "./pages/Whitepaper";
import Roadmap from "./pages/Roadmap";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Games" element={<Games />} />
        <Route path="/staking" element={<Staking />} />
        <Route path="/whitepaper" element={<Whitepaper />} />
        <Route path="/roadmap" element={<Roadmap />} />
      </Routes>
    </Router>
  );
}

export default App;