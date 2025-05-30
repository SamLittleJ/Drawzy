import React from 'react';
import { Link } from "react-router-dom";
import styles from './HomePage.module.css';

export default function HomePage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Welcome to Drawzy</h1>
            <p className={styles.subtitle}>Login into your account or create a new one to start drawing and guessing!</p>
            <div className={styles.buttons}>
                <Link to="/login"><button className={styles.button}>Login</button></Link>
                <Link to="/register"><button className={styles.button}>Register</button></Link>
            </div>
        </div>
    );
}