import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-purple-900 text-pink-300 p-4 flex justify-between">
      <Link to="/" className="text-2xl font-bold tracking-widest">＄ＩＥ</Link>
      <div className="space-x-4">
        <Link to="/games">Games</Link>
        <Link to="/staking">Staking</Link>
        <Link to="/whitepaper">Whitepaper</Link>
        <Link to="/roadmap">Roadmap</Link>
      </div>
    </nav>
  );
}