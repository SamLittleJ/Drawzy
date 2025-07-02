// Import React
// • Rol: Bibliotecă principală pentru construirea interfeței UI cu JSX.
import React from 'react';

// Import Link din React Router
// • Rol: Permite navigarea declarativă între rute fără reîncărcarea paginii.
import { Link } from "react-router-dom";

// Import stiluri modulare CSS
// • Rol: Clase CSS izolate pentru stilizarea componentelor din HomePage.
import styles from './HomePage.module.css';

// Componentă: HomePage
// • Rol: Renderizează ecranul principal cu titlul, citatul și butonul de început.
// • Motiv: Punctul de intrare vizual în aplicație pentru utilizatori neautentificați.
export default function HomePage() {
    // Render UI
    return (
        // Container Principal
        // • Rol: Centrul layout-ului și spațierea conținutului pe ecran.
        <div className={styles.container}>
            {/* Titlu Aplicație */}
            {/* • Rol: Afișează numele aplicației cu stilul definit. */}
            <h1 className={styles.title}>Drawzy</h1>

            {/* Subtitlu/Citat */}
            {/* • Rol: Prezintă un citat inspirațional sub titlu. */}
            <p className={styles.subtitle}>"Creativity is intelligence having fun." – Albert Einstein</p>

            {/* Container Buton */}
            {/* • Rol: Găzduiește butonul principal de navigare la pagina de login. */}
            <div className={styles.buttons}>
                {/* Link către Login */}
                {/* • Rol: Navighează utilizatorul la ecranul de autentificare. */}
                <Link to="/login">
                  {/* Buton Principal */}
                  {/* • Rol: Inițiază fluxul de autentificare pentru utilizator. */}
                  <button className={styles.mainButton}>
                    Let creativity begin
                  </button>
                </Link>
            </div>
        </div>
    );
}