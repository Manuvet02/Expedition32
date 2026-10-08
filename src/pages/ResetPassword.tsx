import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../hooks/useAuth";

export default function ResetPassword() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("La password deve contenere almeno 8 caratteri.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Le password non coincidono.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) setMessage("Non riesco ad aggiornare la password. Richiedi un nuovo link.");
    else navigate("/", { replace: true });
  }

  if (loading) return <p className="search-message">Verifico il link…</p>;
  if (!session) {
    return (
      <div className="auth-page"><div className="auth-card">
        <p className="eyebrow">ACCESSO</p>
        <h1>Link scaduto.</h1>
        <p>Link non valido o scaduto. Richiedi un nuovo link per impostare la password.</p>
        <Link to="/login">Torna all'accesso</Link>
      </div></div>
    );
  }

  return (
    <div className="auth-page">
    <form className="auth-card" onSubmit={handleSubmit}>
      <p className="eyebrow">IL TUO ACCOUNT</p>
      <h1>Imposta la password.</h1>
      <label>
        Nuova password
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label>
        Ripeti la password
        <input
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
      </label>
      <button disabled={submitting}>
        {submitting ? "Salvo…" : "Salva password"}
      </button>
      {message && <p className="auth-message" role="alert">{message}</p>}
    </form>
    </div>
  );
}
