// Import React și ReactDOM
// • Rol: React furnizează funcționalități de construire a UI-ului; ReactDOM le atașează la DOM.
import React from 'react';
import { createRoot } from 'react-dom/client';

// Importul componentelor principale și stilurile globale
// • Rol: `App` conține structura aplicației, iar `App.css` definește tema retro pixel art.
import App from './App';
import './App.css';

// Inițializare punct de montare și render al aplicației
// • Rol: Găsește elementul root din HTML și încarcă componenta `App` în container.
// • Alternative: ReactDOM.render(<App />, container) pentru versiunile React mai vechi de 18.
const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);