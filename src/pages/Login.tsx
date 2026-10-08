import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabase";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // solo utenti già invitati
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setStatus("error");
      setMessage(
        "Non riesco a mandare il link. Sei stato invitato con questa email?",
      );
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return <p>Controlla la posta: ti ho mandato il link per entrare ✉️</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Accedi</h1>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="la tua email"
      />
      <button disabled={status === "sending"}>
        {status === "sending" ? "Invio…" : "Mandami il link"}
      </button>
      {status === "error" && <p>{message}</p>}
    </form>
  );
}
