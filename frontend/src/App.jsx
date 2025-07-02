import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useMemo } from 'react';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import RoomPage from './pages/RoomPage';
import './App.css';

// Funcție: isLoggedIn
// • Rol: Verifică dacă utilizatorul este autentificat prin existența unui token în localStorage.
// • Motiv: Permite protejarea rutelor private (lobby, room) și redirecționarea utilizatorilor neautentificați.
// • Alternative: Verificare a expirării token-ului sau consultare API pentru validitate.
// • Observații: Simplă validare booleană, nu detectează token expirat.
export function isLoggedIn() {
    const token = localStorage.getItem('access_token');
    return Boolean(token);
}

// Componentă: App
// • Rol: Punctul de intrare al aplicației, definește schema de navigație și animațiile de fundal.
// • Motiv: Centralizează router-ul React și efectele vizuale pentru toate paginile.
// • Alternative: Separarea animațiilor într-un provider/Hook separat.
// • Observații: Folosește useMemo pentru a genera o dată lista de particule.
export default function App() {
    // Helper: randPercent
    // • Rol: Generează un procent aleator între 0% și 100% pentru poziționarea particulelor.
    // • Motiv: Alocă poziții random pe axele X și Y la inițializare.
    // • Alternative: Funcție pur matematică, fără procent (valori de 0 la 1).
    const randPercent = () => `${Math.random() * 100}%`;

    const animNames = ['float1', 'float2', 'float3', 'flyNE', 'flyNW', 'flyUp', 'flyDown'];

    // Generare particule: particlesList
    // • Rol: Creează o listă de obiecte cu atribute pentru animațiile de fundal (tip, direcție, durată).
    // • Motiv: Eficientizează calculul folosind useMemo pentru a nu regenera la fiecare render.
    // • Alternative: Generare la mount cu useEffect și stocare în state.
    const particlesList = useMemo(() => {
      return ['brush', 'eraser', 'palette', 'pencil', 'bucket', 'marker'].flatMap(type =>
        Array.from({ length: 10 }).map((_, i) => {
          // pick random animation
          const animName = animNames[Math.floor(Math.random() * animNames.length)];
          // random duration between 10s and 25s
          const duration = 10 + Math.random() * 15;
          // random start edge: 0=left,1=right,2=top,3=bottom
          const edge = Math.floor(Math.random() * 4);
          let style = {};
          const pos = randPercent();
          // set starting position on chosen edge
          if (edge === 0) style = { left: '-10%', top: pos };
          else if (edge === 1) style = { left: '110%', top: pos };
          else if (edge === 2) style = { top: '-10%', left: pos };
          else style = { top: '110%', left: pos };
          return {
            type,
            animName,
            delay: Math.random() * 10,
            duration,
            style,
          };
        })
      );
    }, []);

    return (
      <>
        {/* Secțiune vizuală: particule animate */}
        {/* • Rol: Afișează elemente decorative animate pe fundalul aplicației */}
        {/* • Observații: Particlele nu interacționează cu restul UI-ului */}
        <div className="particles">
          {particlesList.map(({ type, animName, delay, duration, style }, idx) => (
            <div
              key={`${type}-${idx}`}
              className={`particle ${type}`}
              style={{
                animationName: animName,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
                animationFillMode: 'both',
                ...style
              }}
            />
          ))}
        </div>

        {/* Router Principal */}
        {/* • Rol: Definește rutele aplicației și protejează paginile cu autentificare */}
        {/* • Alternative: Alte librării de routing sau server-side routing */}
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route 
            path="/lobby" 
            element={ isLoggedIn() ? <LobbyPage /> : <Navigate to="/login" replace />} />
            <Route 
            path="/rooms/:code"
            element={ isLoggedIn() ? <RoomPage /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </>
    );
}