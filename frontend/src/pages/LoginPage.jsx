import React, {useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import styles from './LoginPage.module.css';


export default function LoginPage () {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try{
            const resp = await api.loginUser({email, password});
            localStorage.setItem('access_token', resp.data.access_token);
            localStorage.removeItem('token'); // Remove old token if exists
            navigate('/lobby'); // Redirect to lobby after successful login
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Login failed');
        }
    }
return (
    <div className={styles.formContainer}>
        <h2 className={styles.title}>Login</h2>
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
            <button type="submit" className={styles.submitButton}>Login</button>
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


