import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLE_HOME } from "../auth/ProtectedRoute";
import { IconAlertTriangle } from "../components/icons";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(username, password);
      navigate(ROLE_HOME[user.role] || "/", { replace: true });
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Incorrect username or password."
          : "Unable to sign in. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">H</div>
          <div className="login-brand-text">
            <h1>South B HMIS</h1>
            <p>Hospital Management System</p>
          </div>
        </div>

        {error && (
          <div className="login-error">
            <IconAlertTriangle style={{ width: 14, height: 14, marginRight: 6, verticalAlign: -2 }} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary login-submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="login-demo">
          <strong>Demo accounts</strong> (seeded)<br />
          Admin: admin / admin12345<br />
          Doctor: drjane / doctor12345<br />
          Nurse: nursejoy / nurse12345
        </div>
      </div>
    </div>
  );
}