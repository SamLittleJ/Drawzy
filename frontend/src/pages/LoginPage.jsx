// Import React și hook-uri
// • Rol: React pentru JSX și useState pentru gestionarea stărilor componentei.
import React, { useState } from 'react';

// Import React Router
// • Rol: useNavigate pentru navigare programatică și Link pentru legături declarative.
import { useNavigate, Link } from 'react-router-dom';

// Import API client
// • Rol: Funcții pentru apeluri HTTP către backend (autentificare).
import api from '../api';

// Import stiluri modulare CSS
// • Rol: Clase CSS izolate pentru stilizarea paginii de login.
import styles from './LoginPage.module.css';

// Componentă: LoginPage
// • Rol: Pagina de autentificare a utilizatorului.
// • Motiv: Oferă formular de login și logica de trimitere a datelor.
// • Alternative: Utilizarea unei librării de formulare (Formik, React Hook Form).
export default function LoginPage() {
  // State-uri formular
  // • Rol: Păstrează valorile inputurilor și mesajul de eroare.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Funcție: handleLogin
  // • Rol: Trimite datele de autentificare la server și gestionează răspunsul.
  // • Observații: Stochează token-ul și navighează la lobby la succes; afișează eroare la eșec.
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const resp = await api.loginUser({ email, password });
      localStorage.setItem('access_token', resp.data.access_token);
      localStorage.removeItem('token'); // Remove old token if exists
      navigate('/lobby'); // Redirect to lobby after successful login
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  // Render UI
  // • Rol: Afișează formularul de autentificare și eventualele mesaje de eroare.
  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Login</h2>

      {/* Afișare eroare
          • Rol: Afișează mesajul de eroare dacă autentificarea a eșuat */}
      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleLogin}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Password</label>
          <input
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Buton submit
            • Rol: Trimite formularul de login */}
        <button type="submit" className={styles.submitButton}>
          Login
        </button>
      </form>

      <p className={styles.footerText}>
        Don't have an account?{' '}
        {/* Link către înregistrare
            • Rol: Oferă utilizatorilor posibilitatea de a se înregistra dacă nu au cont */}
        <Link className={styles.footerLink} to="/register">
          Register here.
        </Link>
      </p>
    </div>
  );
}