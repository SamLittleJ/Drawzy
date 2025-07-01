import React from 'react';
import { Link } from "react-router-dom";
import styles from './HomePage.module.css';

export default function HomePage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Drawzy</h1>
            <p className={styles.subtitle}>"Creativity is intelligence having fun." – Albert Einstein</p>
            <div className={styles.buttons}>
                <Link to="/login">
                  <button className={styles.mainButton}>
                    Let creativity begin
                  </button>
                </Link>
            </div>
        </div>
    );
}