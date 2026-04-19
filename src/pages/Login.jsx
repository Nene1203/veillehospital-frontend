import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const HexLogo = () => (
  <svg viewBox="0 0 64 64" fill="none">
    <polygon points="32,4 56,18 56,46 32,60 8,46 8,18" fill="#E6F7F6" />
    <polygon points="32,10 50,20 50,44 32,54 14,44 14,20" fill="#00A89D" opacity="0.25" />
    <polygon points="32,16 48,25 48,43 32,52 16,43 16,25" fill="#00A89D" />
    <polygon points="38,16 48,25 48,32 32,32 32,16" fill="#8DC63F" />
  </svg>
);

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || "Email ou mot de passe incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <HexLogo />
          <div className="login-brand">HévivA</div>
          <div className="login-tagline">Des liens. Des lieux. La vie !</div>
        </div>

        <div className="login-platform">Plateforme de suivi des veilles hospitalières</div>
        <hr className="login-divider" />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Adresse email</label>
            <input
              className="form-input"
              type="email"
              placeholder="votre@email.ch"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>

        <div className="login-demo">
          Compte de démo : <strong>admin@veille.fr</strong> / <strong>admin123</strong>
        </div>
      </div>
    </div>
  );
}
