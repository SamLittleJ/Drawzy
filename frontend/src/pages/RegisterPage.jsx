import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import api from '../api'; // Assuming you have an api.js file for API calls
import styles from './RegisterPage.module.css'; // Optional: import styles if needed

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState(null);
const nav = useNavigate();

const handleSubmit - async (e) => {
    e.preventDefault();
    try {
        setError(null);
        await api.registerUser({email, password});
        nav('/login'); // Redirect to login page after successful registration
    } catch (err) {
        console
        setError(err.response?.data?.detail || 'Registration failed');
    }
};

return {
    <div className={styles.formContainer}>
        <h2 className={styles.title}>Register</h2>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
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
            <button type="submit" className={styles.submitButton}>Submit</button>
        </form>
        <p className={styles.footerText}>
            Already have an account?{' '}
            <Link className={styles.footerLink} to="/login">
                Login here.
            </Link>
        </p>
    </div>
}