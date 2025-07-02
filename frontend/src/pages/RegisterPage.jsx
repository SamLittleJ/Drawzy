// Import React și hook-uri
// • Rol: React pentru JSX și useState pentru gestionarea stărilor locale.
import React, { useState } from 'react';

// Import React Router
// • Rol: useNavigate pentru navigare programatică și Link pentru legături declarative.
import { useNavigate, Link } from 'react-router-dom';

// Import API client
// • Rol: Funcții pentru apeluri HTTP către backend (înregistrare, login etc.).
import api from '../api';

// Import stiluri modulare CSS
// • Rol: Clasă CSS izolată pentru stilizarea componentei de înregistrare.
import styles from './RegisterPage.module.css';


// Componentă: RegisterPage
// • Rol: Pagina de înregistrare a unui nou utilizator.
// • Motiv: Centralizează formularul și logica de trimitere date.
// • Alternative: Form library (Formik, React Hook Form).
export default function RegisterPage() {
  // State-uri formular
  // • Rol: Păstrează valorile inputurilor și mesajul de eroare.
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const nav = useNavigate();

  // Funcție: handleSubmit
  // • Rol: Trimite datele de înregistrare la server și navighează la login.
  // • Observații: Prinde erorile și afișează detaliul din răspuns.
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      await api.registerUser({ username, email, password });
      nav('/login'); // Redirect la pagina de login după înregistrare reușită
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Registration failed');
    }
  };

  // Render UI
  // • Rol: Afișează formularul de înregistrare și eventualele erori.
  return (
    <div className={styles.formContainer}>
      <h2 className={styles.title}>Register</h2>

      {/* Afișare eroare
          • Rol: Arată mesajul de eroare dacă există. */}
      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Username</label>
          <input
            type="text"
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

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
            • Rol: Trimite formularul de înregistrare. */}
        <button type="submit" className={styles.submitButton}>
          Submit
        </button>
      </form>

      <p className={styles.footerText}>
        Already have an account?{' '}
        {/* Link către login
            • Rol: Permite navigarea utilizatorului la pagina de autentificare. */}
        <Link className={styles.footerLink} to="/login">
          Login here.
        </Link>
      </p>
    </div>
  );
}