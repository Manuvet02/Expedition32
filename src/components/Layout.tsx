import { Link, Outlet } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../hooks/useAuth";

export default function Layout() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name;

  return (
    <div className="site-shell">
      <a className="skip-link" href="#contenuto">Vai al contenuto</a>
      <header className="site-header">
        <div className="site-masthead">
          <Link className="site-brand" to="/" aria-label="Expedition 32, home">
            <span>Expedition</span><b>32</b>
          </Link>
          <p className="site-tagline">La nostra raccolta di storie e punti di vista</p>
          <div className="site-account">
            <Link to={user ? `/u/${user.id}` : "/login"}>
              {displayName || "Profilo"}
            </Link>
            <button className="text-button" onClick={() => supabase.auth.signOut()}>
              Esci
            </button>
          </div>
        </div>
        <nav className="site-nav" aria-label="Navigazione principale">
          <Link to="/">Home</Link>
          <Link to="/search">Cerca opere</Link>
          {user && <Link to={`/u/${user.id}`}>Il mio profilo</Link>}
        </nav>
      </header>
      <main id="contenuto" className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <Link className="site-footer-brand" to="/">Expedition <span>32</span></Link>
        <p>Un’opera, tante prospettive.</p>
      </footer>
    </div>
  );
}
