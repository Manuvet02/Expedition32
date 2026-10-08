import { Link, Outlet } from "react-router-dom";
import { supabase } from "../supabase";

export default function Layout() {
  return (
    <>
      <header>
        <Link to="/">Home</Link> · <Link to="/search">Cerca</Link> ·{" "}
        <button onClick={() => supabase.auth.signOut()}>Esci</button>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  );
}
