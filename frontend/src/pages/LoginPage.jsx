import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api, { getErrorMessage, setToken } from '../api';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.loginUser({ email, password });
      setToken(data.access_token);
      navigate('/lobby');
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed'));
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Login</h2>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <form onSubmit={handleLogin}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.submitButton}>
          Login
        </button>
      </form>

      <p className={styles.footerText}>
        Don't have an account?{' '}
        <Link className={styles.footerLink} to="/register">
          Register here.
        </Link>
      </p>
    </div>
  );
}
