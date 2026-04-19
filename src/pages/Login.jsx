import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login({ onLogin }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onLogin?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ width: 380, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", padding: "36px 32px" }}>

        {/* Logo */}
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--blue-700)", letterSpacing: "-0.4px" }}>VeilleHospital</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Connectez-vous à votre espace</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Adresse email</label>
            <input
              className="form-input"
              type="email"
              placeholder="vous@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label">Mot de passe</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--red-50)", color: "var(--red-600)", borderRadius: "var(--radius-md)", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: 14 }}
            disabled={loading}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: "12px 14px", background: "var(--gray-50)", borderRadius: "var(--radius-md)", fontSize: 12, color: "var(--text-hint)" }}>
          Compte de démo : <strong style={{ color: "var(--text-secondary)" }}>admin@veille.fr</strong> / <strong style={{ color: "var(--text-secondary)" }}>admin123</strong>
        </div>
      </div>
    </div>
  );
}
