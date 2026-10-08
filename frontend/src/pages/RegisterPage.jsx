import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api, { getErrorMessage } from '../api';
import styles from './RegisterPage.module.css';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.registerUser({ username, email, password });
      navigate('/login');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed'));
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Register</h2>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="register-username">Username</label>
          <input
            id="register-username"
            type="text"
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={50}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.submitButton}>
          Submit
        </button>
      </form>

      <p className={styles.footerText}>
        Already have an account?{' '}
        <Link className={styles.footerLink} to="/login">
          Login here.
        </Link>
      </p>
    </div>
  );
}
