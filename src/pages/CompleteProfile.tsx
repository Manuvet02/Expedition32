import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../hooks/useAuth";

export default function CompleteProfile() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const name = displayName.trim();
    if (!name) {
      setMessage("Inserisci il nome che vedranno i tuoi amici.");
      return;
    }
    if (password.length < 8) {
      setMessage("La password deve contenere almeno 8 caratteri.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Le password non coincidono.");
      return;
    }
    if (!session?.user) return;

    setSubmitting(true);
    const { error: authError } = await supabase.auth.updateUser({
      password,
      data: { display_name: name },
    });

    if (authError) {
      setSubmitting(false);
      setMessage("Non riesco a salvare la password. Richiedi un nuovo invito.");
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: session.user.id, display_name: name }, { onConflict: "id" });

    setSubmitting(false);
    if (profileError) {
      setMessage("Password salvata, ma non riesco ad aggiornare il profilo. Riprova tra poco.");
      return;
    }

    navigate("/", { replace: true });
  }

  if (loading) return <p>Verifico l'invito…</p>;
  if (!session) {
    return (
      <div className="auth-page"><div className="auth-card">
        <p className="eyebrow">IL TUO ACCOUNT</p>
        <h1>Invito non valido.</h1>
        <p>Invito non valido o scaduto. Chiedi di ricevere un nuovo link.</p>
        <Link to="/login">Vai all'accesso</Link>
      </div></div>
    );
  }

  return (
    <div className="auth-page">
    <form className="auth-card" onSubmit={handleSubmit}>
      <p className="eyebrow">BENVENUTO NEL GRUPPO</p>
      <h1>Completa il profilo.</h1>
      <p>{session.user.email}</p>
      <label>
        Nome visualizzato
        <input
          type="text"
          autoComplete="name"
          maxLength={60}
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Come ti vedranno gli amici"
        />
      </label>
      <label>
        Password
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
        {submitting ? "Salvo…" : "Completa registrazione"}
      </button>
      {message && <p className="auth-message" role="alert">{message}</p>}
    </form>
    </div>
  );
}
