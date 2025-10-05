import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../Firebase"; // adjust path as needed

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log("Logged in:", userCredential.user);

      navigate("/");
    } catch (err) {
      console.error(err.message);
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-text">SLA</span>
        </div>
        <h2 className="login-title">Login</h2>
        <p className="login-desc">
          Welcome back to SLA Invisible Grills Admin Panel.
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="wrapcode.info@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? <span className="loader"></span> : "LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
