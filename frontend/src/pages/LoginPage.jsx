import React from 'react';
import {useNavigate, Link} from 'react-router-dom';
import api from '../api'; // Assuming you have an api.js file for API calls
import styles from './LoginPage.module.css'; // Optional: import styles if needed

export default function LoginPage() {
    const nav = useNavigate();
    
    const handleLogin = async ({email, password}) => {
        try {
            const resp = await api.loginUser({email, password});
            // Store the token in localStorage
            localStorage.setItem('access_token', resp.data.access_token);
            localStorage.removeItem('token'); // Remove old token if exists
            nav('/lobby');
        } catch (err) {
            console.error('Login failed', err)
            alert(err.response?.data?.detail ||
            (err.response?.data ? JSON.stringify(err.response.data): err.message)    ||
                 'Login failed');
        }
    }

    return (
        <div className={styles.formContainer}>
            <h2 className={styles.title}>Log In</h2>
            <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const email = form.email.value;
                const password = form.password.value;
                handleLogin({email, password});
            }}>
                <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        className={styles.input}
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        className={styles.input}
                        required
                    />
                </div>
                <button type="submit" className={styles.submitButton}>Log In</button>
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