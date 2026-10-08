import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [resetSent, setResetSent] = useState(false);

  if (loading) return <p className="search-message">Controllo l'accesso…</p>;
  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setSubmitting(false);
    if (error) setMessage("Email o password non corretti.");
  }

  async function sendPasswordReset() {
    if (!email.trim()) {
      setMessage("Inserisci prima la tua email.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);

    if (error) setMessage("Non riesco a inviare il link di recupero.");
    else setResetSent(true);
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">UN POSTO PER IL NOSTRO GRUPPO</p>
        <h1>Accedi.</h1>
        <p>Entra nella raccolta condivisa delle nostre storie preferite.</p>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="la tua email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="La tua password"
          />
        </label>
        <button disabled={submitting}>
          {submitting ? "Accesso…" : "Accedi"}
        </button>
        <button className="auth-secondary" type="button" onClick={sendPasswordReset} disabled={submitting}>
          Imposta o recupera la password
        </button>
        {resetSent && <p className="auth-message">Se l'email è registrata, riceverai un link per impostare la password.</p>}
        {message && <p className="auth-message" role="alert">{message}</p>}
        <p>Gli account sono riservati alle persone invitate dal gruppo.</p>
      </form>
    </div>
  );
}
